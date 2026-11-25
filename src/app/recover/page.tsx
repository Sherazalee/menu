import { randomBytes } from "node:crypto";
import Link from "next/link";
import type { FormState } from "@/app/account/actions";
import { ActionForm } from "@/app/account/forms";
import { AccountShell } from "@/app/account/shell";
import { allowAttempt, currentAccount, digest } from "@/lib/auth";
import { passwordHelp, passwordPattern, usernamePattern } from "@/lib/credentials.mjs";
import { getDatabase } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password.mjs";

async function createRecoveryCode(_state: FormState, form: FormData): Promise<FormState> {
  "use server";

  try {
    const account = await currentAccount();
    if (!account) return { error: "Sign in to generate a recovery code." };

    const password = String(form.get("currentPassword") ?? "");
    if (!password || password.length > 256) return { error: "Enter your current password." };

    if (!(await allowAttempt("recovery-enroll", account.id, 8))) {
      return { error: "Too many attempts. Try again in 15 minutes." };
    }

    const sql = getDatabase();
    const [stored] = await sql`
      SELECT password_hash
      FROM accounts
      WHERE id = ${account.id} AND credential_version = ${account.credential_version}
    `;

    if (!(await verifyPassword(password, stored?.password_hash))) {
      return { error: "Could not verify your current password." };
    }

    const code = randomBytes(24).toString("hex");
    const [updated] = await sql`
      UPDATE accounts
      SET recovery_code_hash = ${digest(code)},
          recovery_code_version = credential_version,
          recovery_code_expires_at = clock_timestamp() + interval '180 days'
      WHERE id = ${account.id} AND credential_version = ${account.credential_version}
      RETURNING id
    `;

    if (!updated) return { error: "Your credentials changed. Sign in again." };

    return { message: `Save this recovery code now: ${code}` };
  } catch {
    return { error: "Could not generate a recovery code. Try again." };
  }
}

async function resetPassword(_state: FormState, form: FormData): Promise<FormState> {
  "use server";

  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const code = String(form.get("code") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  const invalid = { error: "The username or recovery code is invalid or expired." };

  if (!new RegExp(`^(?:${usernamePattern})$`).test(username) || !/^[a-f0-9]{48}$/.test(code)) {
    return invalid;
  }

  if (password.length > 256 || !new RegExp(`^(?:${passwordPattern})$`, "u").test(password)) {
    return { error: passwordHelp };
  }

  if (password !== confirmPassword) return { error: "The new passwords must match." };

  try {
    if (
      !(await allowAttempt("recovery-reset-global", "all", 100)) ||
      !(await allowAttempt("recovery-reset-account", username, 8))
    ) {
      return { error: "Too many attempts. Try again in 15 minutes." };
    }

    const newHash = await hashPassword(password);
    const sql = getDatabase();

    const [updated] = await sql`
      UPDATE accounts
      SET password_hash = ${newHash},
          credential_version = credential_version + 1,
          recovery_code_hash = NULL,
          recovery_code_version = NULL,
          recovery_code_expires_at = NULL
      WHERE username = ${username}
        AND recovery_code_hash = ${digest(code)}
        AND recovery_code_version = credential_version
        AND recovery_code_expires_at > clock_timestamp()
      RETURNING id
    `;

    if (!updated) return invalid;

    return { message: "Password reset. Sign in with your new password." };
  } catch {
    return { error: "Password recovery is temporarily unavailable." };
  }
}

export default async function RecoveryPage() {
  const account = await currentAccount();

  if (account) {
    return (
      <AccountShell title="Set up password recovery">
        <p className="mt-4">
          Save the recovery code somewhere you can access if you forget your password.
          It works once, expires after 180 days, and becomes invalid if you change your credentials.
          Generating a new code replaces the previous one.
        </p>
        <ActionForm action={createRecoveryCode} submit="Generate recovery code">
          <label className="block">
            <span className="form-label">Current password</span>
            <input
              className="form-input"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              maxLength={256}
              required
            />
          </label>
        </ActionForm>
        <Link href="/account" className="mt-5 inline-block underline">Back to your account</Link>
      </AccountShell>
    );
  }

  return (
    <AccountShell title="Reset your password">
      <p className="mt-4">Enter the recovery code you saved from your account.</p>
      <ActionForm action={resetPassword} submit="Reset password">
        <label className="block">
          <span className="form-label">Username</span>
          <input
            className="form-input"
            name="username"
            autoComplete="username"
            pattern={usernamePattern}
            maxLength={32}
            required
          />
        </label>

        <label className="block">
          <span className="form-label">Recovery code</span>
          <input
            className="form-input"
            name="code"
            type="password"
            autoComplete="off"
            pattern="[A-Fa-f0-9]{48}"
            maxLength={48}
            required
          />
        </label>

        <label className="block">
          <span className="form-label">New password</span>
          <input
            className="form-input"
            name="password"
            type="password"
            autoComplete="new-password"
            pattern={passwordPattern}
            maxLength={256}
            aria-describedby="recovery-password-help"
            required
          />
        </label>
        <p id="recovery-password-help" className="text-sm">{passwordHelp}</p>

        <label className="block">
          <span className="form-label">Confirm new password</span>
          <input
            className="form-input"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            maxLength={256}
            required
          />
        </label>
      </ActionForm>
      <Link href="/login" className="mt-5 inline-block underline">Back to sign-in</Link>
    </AccountShell>
  );
}