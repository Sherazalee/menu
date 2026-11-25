import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { login } from "../account/actions";
import { ActionForm, CredentialFields } from "../account/forms";
import { AccountShell } from "../account/shell";

export default async function LoginPage() {
  const account = await currentAccount();
  if (account) redirect(account.role === "admin" ? "/admin" : "/account");

  return (
    <AccountShell title="Sign in">
      <ActionForm action={login} submit="Sign in">
        <CredentialFields mode="login" />
      </ActionForm>
      <div className="mt-5 space-y-2">
        <p><Link className="underline" href="/recover">Forgot your password?</Link></p>
        <p>New here? <Link className="underline" href="/register">Create an account</Link></p>
      </div>
    </AccountShell>
  );
}