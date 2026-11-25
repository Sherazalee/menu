import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDatabase } from "./db";

const secure = process.env.NODE_ENV === "production";
const cookieName = secure ? "__Host-menu-session" : "menu-session";
const sessionSeconds = 60 * 60 * 24 * 7;
const sessionCookie = { httpOnly: true, secure, sameSite: "lax", path: "/" } as const;

export function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export type Account = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  credential_version: string;
};

export async function currentAccount() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;

  const sql = getDatabase();
  const [account] = await sql`
    SELECT a.id, a.username, a.email, a.role, a.credential_version
    FROM accounts a JOIN account_sessions s ON s.account_id = a.id
    WHERE s.token_hash = ${digest(token)} AND s.expires_at > now()
      AND s.credential_version = a.credential_version
  `;
  return (account as Account | undefined) ?? null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token && /^[0-9a-f]{64}$/.test(token)) {
    const sql = getDatabase();
    await sql`DELETE FROM account_sessions WHERE token_hash = ${digest(token)}`;
  }
  jar.set(cookieName, "", { ...sessionCookie, maxAge: 0 });
}

export async function startSession(account: Pick<Account, "id" | "credential_version">) {
  const token = randomBytes(32).toString("hex");
  const sql = getDatabase();
  const expires = new Date(Date.now() + sessionSeconds * 1000);
  const inserted = await sql`
    INSERT INTO account_sessions (token_hash, account_id, credential_version, expires_at)
    SELECT ${digest(token)}, id, credential_version, ${expires.toISOString()}
    FROM accounts WHERE id = ${account.id} AND credential_version = ${account.credential_version}
    RETURNING token_hash
  `;
  if (!inserted.length) return false;

  (await cookies()).set(cookieName, token, {
    ...sessionCookie, expires,
  });
  return true;
}

export async function allowAttempt(scope: string, identity: string, limit: number) {
  const sql = getDatabase();
  const windowStart = Math.floor(Date.now() / 900000);
  const [row] = await sql`
    INSERT INTO auth_attempts (scope, identity, window_start, attempts)
    VALUES (${scope}, ${digest(identity)}, ${windowStart}, 1)
    ON CONFLICT (scope, identity) DO UPDATE SET
      attempts = CASE WHEN auth_attempts.window_start < EXCLUDED.window_start THEN 1
                      ELSE least(auth_attempts.attempts, ${limit}) + 1 END,
      window_start = greatest(auth_attempts.window_start, EXCLUDED.window_start)
    RETURNING attempts
  `;
  return Number(row.attempts) <= limit;
}

