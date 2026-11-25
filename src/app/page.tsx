
import type { Metadata } from "next";
import Link from "next/link";
import { currentAccount } from "@/lib/auth";
import { getSettings, sortOptions } from "@/lib/settings";
import MenuHome from "./menu-home";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: `${settings.site_name} | ${settings.tagline}`,
    description: settings.site_description,
  };
}

export default async function Home() {
  const [settings, account] = await Promise.all([
    getSettings(),
    currentAccount(),
  ]);

  return (
    <>
      <section className="bg-[#203026] px-4 py-3 text-[#F7F3EA] sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-center text-sm sm:text-left">
            {account
              ? `Welcome back, ${account.username}. Reserve your seat or manage your order.`
              : "Discover our menu, reserve a table, and order your favourites."}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href={account ? "/dining" : "/login"}
              className="rounded-full bg-[#F7F3EA] px-4 py-2 text-sm font-semibold text-[#203026] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Book a Table
            </Link>

            <Link
              href={account ? "/dining" : "/login"}
              className="rounded-full border border-[#F7F3EA]/60 px-4 py-2 text-sm font-semibold text-[#F7F3EA] transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {account ? "Place / View Orders" : "Sign In to Order"}
            </Link>

            {account?.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-full border border-[#F7F3EA]/60 px-4 py-2 text-sm font-semibold text-[#F7F3EA] transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </section>

      <MenuHome
        settings={settings}
        sortOptions={sortOptions}
        signedIn={Boolean(account)}
        canManage={account?.role === "admin"}
      />
    </>
  );
}
