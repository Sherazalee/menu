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
  const [settings, account] = await Promise.all([getSettings(), currentAccount()]);

  return (
    <>
      <div className="bg-[#203026] px-5 py-2 text-center text-sm text-[#F7F3EA]">
        <Link href={account ? "/dining" : "/login"} className="underline underline-offset-4">
          {account ? "Book a table or view your orders" : "Sign in to book a table"}
        </Link>
      </div>
      <MenuHome
        settings={settings}
        sortOptions={sortOptions}
        signedIn={Boolean(account)}
        canManage={account?.role === "admin"}
      />
    </>
  );
}