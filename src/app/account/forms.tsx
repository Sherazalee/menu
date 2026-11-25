"use client";

import { startTransition, useActionState, type ReactNode } from "react";
import { emailPattern, passwordHelp, passwordPattern, usernamePattern } from "@/lib/credentials.mjs";
import type { FormState } from "./actions";

export function ActionForm({ action, children, submit }: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  children: ReactNode;
  submit: string;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  return (
    <form action={dispatch} className="mt-7 space-y-5" onSubmit={(event) => {
      event.preventDefault();
      if (pending) return;
      const form = event.currentTarget;
      const data = new FormData(form);
      for (const input of form.querySelectorAll<HTMLInputElement>('input[type="password"]')) {
        input.value = "";
      }
      startTransition(() => dispatch(data));
    }}>
      {children}
      {state.error && <p role="alert" className="rounded-lg bg-[#FAE8E0] p-3 text-[#803923]">{state.error}</p>}
      {state.message && <p role="status" className="rounded-lg bg-[#E4EBDF] p-3">{state.message}</p>}
      <button disabled={pending} className="account-button">{pending ? "Please wait…" : submit}</button>
    </form>
  );
}

export function CredentialFields({ mode, username, email }: {
  mode: "login" | "register" | "change";
  username?: string;
  email?: string;
}) {
  return <>
    <label className="block">
      <span className="form-label">Username</span>
      <input className="form-input" name="username" autoComplete="username" defaultValue={username}
        required minLength={3} maxLength={32} pattern={usernamePattern} aria-describedby="username-help" />
      <span id="username-help" className="mt-2 block text-sm">3–32 letters, numbers, or underscores.</span>
    </label>
    {mode !== "login" && <label className="block">
      <span className="form-label">Email</span>
      <input className="form-input" type="email" name="email" autoComplete="email"
        defaultValue={email} required maxLength={254} pattern={emailPattern} />
    </label>}
    {mode === "change" && <label className="block">
      <span className="form-label">Current password</span>
      <input className="form-input" type="password" name="currentPassword" autoComplete="current-password"
        required maxLength={256} />
    </label>}
    <label className="block">
      <span className="form-label">{mode === "change" ? "New password (optional)" : "Password"}</span>
      <input className="form-input" type="password" name="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required={mode !== "change"} maxLength={256}
        pattern={mode === "login" ? undefined : passwordPattern}
        aria-describedby={mode === "login" ? undefined : "password-help"} />
      {mode !== "login" && <span id="password-help" className="mt-2 block text-sm">{passwordHelp}</span>}
    </label>
  </>;
}

