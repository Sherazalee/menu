"use server";

import { redirect } from "next/navigation";
import { allowAttempt, currentAccount, endSession, startSession } from "@/lib/auth";
import { validateCredentials, usernamePattern } from "@/lib/credentials.mjs";
import { getDatabase } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password.mjs";

export type FormState = { error?: string; message?: string };

function fields(form: FormData) {
  return {
    username: String(form.get("username") ?? "").trim().toLowerCase(),
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    password: String(form.get("password") ?? ""),
  };
}

export async function login(_state: FormState, form: FormData): Promise<FormState> {
  const { username, password } = fields(form);
  const invalid = { error: "The username or password is incorrect." };
  if (!new RegExp(`^${usernamePattern}$`).test(username) || !password || password.length > 256) return invalid;

  let role: string;
  try {
    if (!(await allowAttempt("login-global", "all", 300)) ||
        !(await allowAttempt("login-account", username, 10))) {
      return { error: "Too many attempts. Try again in 15 minutes." };
    }
    const sql = getDatabase();
    const [account] = await sql`
      SELECT id, role, password_hash, credential_version FROM accounts WHERE username = ${username}
    `;
    if (!(await verifyPassword(password, account?.password_hash)) || !account) return invalid;
    await endSession();
    if (!(await startSession({ id: account.id, credential_version: account.credential_version }))) return invalid;
    role = account.role;
  } catch {
    return { error: "Sign-in is temporarily unavailable." };
  }
  redirect(role === "admin" ? "/admin" : "/account");
}

export async function register(_state: FormState, form: FormData): Promise<FormState> {
  const { username, email, password } = fields(form);
  const error = validateCredentials(username, email, password);
  if (error) return { error };

  try {
    if (!(await allowAttempt("registration", "all", 60))) {
      return { error: "Registration is temporarily limited. Try again in 15 minutes." };
    }
    const sql = getDatabase();
    const [existing] = await sql`SELECT id FROM accounts WHERE username = ${username} OR email = ${email}`;
    if (existing) return { error: "That username or email is already in use." };
    const hash = await hashPassword(password);
    const [account] = await sql`
      INSERT INTO accounts (username, email, password_hash)
      VALUES (${username}, ${email}, ${hash})
      ON CONFLICT DO NOTHING RETURNING id, credential_version
    `;
    if (!account) return { error: "That username or email is already in use." };
    await endSession();
    if (!(await startSession({ id: account.id, credential_version: account.credential_version }))) return { error: "Account created. Sign in to continue." };
  } catch {
    return { error: "Registration is temporarily unavailable." };
  }
  redirect("/account");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function changeCredentials(_state: FormState, form: FormData): Promise<FormState> {
  try {
    const account = await currentAccount();
    if (!account) return { error: "Sign in again to change your credentials." };
    const { username, email, password } = fields(form);
    const current = String(form.get("currentPassword") ?? "");
    const error = validateCredentials(username, email, password || undefined);
    if (error) return { error };
    if (!current || current.length > 256) return { error: "Enter your current password." };
    if (!(await allowAttempt("credentials", account.id, 10))) {
      return { error: "Too many attempts. Try again in 15 minutes." };
    }

    const sql = getDatabase();
    const [stored] = await sql`SELECT password_hash FROM accounts WHERE id = ${account.id}`;
    if (!(await verifyPassword(current, stored?.password_hash))) {
      return { error: "Your current password is incorrect." };
    }
    const [existing] = await sql`
      SELECT id FROM accounts WHERE id <> ${account.id} AND (username = ${username} OR email = ${email})
    `;
    if (existing) return { error: "That username or email is already in use." };
    if ((!password || password === current) && username === account.username && email === account.email) {
      return { message: "Your credentials are already up to date." };
    }

    const hash = password && password !== current ? await hashPassword(password) : stored.password_hash;
    const [updated] = await sql`
      UPDATE accounts SET username = ${username}, email = ${email}, password_hash = ${hash},
        credential_version = credential_version + 1
      WHERE id = ${account.id} AND credential_version = ${account.credential_version}
      RETURNING id, credential_version
    `;
    if (!updated) return { error: "Credentials changed in another session. Sign in again." };
    await endSession();
    if (!(await startSession({ id: updated.id, credential_version: updated.credential_version }))) return { error: "Credentials updated. Sign in again." };
    return { message: "Credentials updated. Other sessions have been signed out." };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: "That username or email is already in use." };
    }
    return { error: "Could not update your credentials. Try again." };
  }
}

