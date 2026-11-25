import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { changeCredentials, logout } from "./actions";
import { ActionForm, CredentialFields } from "./forms";
import { AccountShell } from "./shell";

export default async function AccountPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");

  return (
    <AccountShell title="Your account">
      <div className="mt-5 flex flex-wrap items-center gap-5">
        <form action={logout}><button className="account-button">Sign out</button></form>
        <Link className="underline" href="/dining">Bookings and orders</Link>
        <Link className="underline" href="/recover">Set up password recovery</Link>
        {account.role === "admin" && <Link className="underline" href="/admin">Admin settings</Link>}
      </div>
      <h2 className="mt-8 font-display text-2xl">Change credentials</h2>
      <ActionForm action={changeCredentials} submit="Save credentials">
        <CredentialFields mode="change" username={account.username} email={account.email} />
      </ActionForm>
    </AccountShell>
  );
}