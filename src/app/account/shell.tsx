import Link from "next/link";
import type { ReactNode } from "react";

export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  return <main className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
    <Link href="/" className="font-semibold text-[#27382D] underline underline-offset-4">Back to the restaurant</Link>
    <section className="mt-6 rounded-3xl border border-[#DCD5C8] bg-[#FFFDF8] p-6 sm:p-10">
      <h1 className="font-display text-4xl text-[#27382D]">{title}</h1>
      {children}
    </section>
  </main>;
}

