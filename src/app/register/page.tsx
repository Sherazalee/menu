import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { register } from "../account/actions";
import { ActionForm, CredentialFields } from "../account/forms";
import { AccountShell } from "../account/shell";

export default async function RegisterPage() {
  if (await currentAccount()) redirect("/account");
  return <AccountShell title="Create an account">
    <ActionForm action={register} submit="Create account"><CredentialFields mode="register" /></ActionForm>
    <p className="mt-5">Already registered? <Link className="underline" href="/login">Sign in</Link></p>
  </AccountShell>;
}

