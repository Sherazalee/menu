import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { copyFields, copyLimit, getSettings, settingFields, sortOptions } from "@/lib/settings";
import { logout } from "../account/actions";
import { ActionForm } from "../account/forms";
import { AccountShell } from "../account/shell";
import { saveSettings } from "./actions";

export default async function AdminPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (account.role !== "admin") redirect("/account");

  const settings = await getSettings();

  return (
    <AccountShell title="Site settings">
      <div className="mt-5 flex flex-wrap items-center gap-5">
        <Link className="underline" href="/#menu">Manage menu</Link>
        <Link className="underline" href="/dining#staff-bookings">Table reservations</Link>
        <Link className="underline" href="/account">Your account</Link>
        <form action={logout}><button className="account-button">Sign out</button></form>
      </div>

      <ActionForm action={saveSettings} submit="Save settings">
        <input type="hidden" name="version" value={settings.version} readOnly />

        {settingFields.map(([key, label, max]) => (
          <label className="block" key={key}>
            <span className="form-label">{label}</span>
            {max > 80 ? (
              <textarea
                className="form-input"
                name={key}
                maxLength={max}
                defaultValue={settings[key]}
                required
                rows={3}
              />
            ) : (
              <input
                className="form-input"
                name={key}
                maxLength={max}
                defaultValue={settings[key]}
                required
                pattern={key === "currency_code" ? "[A-Za-z]{3}" : undefined}
              />
            )}
          </label>
        ))}

        <label className="block">
          <span className="form-label">Default menu sort</span>
          <select className="form-input" name="default_sort" defaultValue={settings.default_sort}>
            {Object.entries(sortOptions).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <details className="rounded-xl border border-[#DCD5C8] p-4">
          <summary className="cursor-pointer font-semibold">Homepage copy</summary>
          <div className="mt-4 space-y-4">
            {copyFields.map(([key, label]) => (
              <label className="block" key={key}>
                <span className="form-label">{label}</span>
                <textarea
                  className="form-input"
                  name={key}
                  maxLength={copyLimit}
                  defaultValue={settings.copy[key]}
                  rows={2}
                />
              </label>
            ))}
          </div>
        </details>
      </ActionForm>
    </AccountShell>
  );
}