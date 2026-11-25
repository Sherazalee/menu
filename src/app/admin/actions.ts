"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/app/account/actions";
import { currentAccount } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { copyFields, copyLimit, settingFields, sortOptions } from "@/lib/settings";

export async function saveSettings(_state: FormState, form: FormData): Promise<FormState> {
  try {
    if ((await currentAccount())?.role !== "admin") return { error: "Admin access is required." };
    const values = settingFields.map(([key, label, limit]) => {
      const value = String(form.get(key) ?? "").trim();
      return { value: key === "currency_code" ? value.toUpperCase() : value, label, limit };
    });
    const invalid = values.find(({ value, limit }) => !value || value.length > limit || value.includes("\0"));
    if (invalid) return { error: `${invalid.label} must be 1–${invalid.limit} characters.` };

    const [name, tagline, description, intro, currencyLabel, currencyCode] = values.map(({ value }) => value);
    const sort = String(form.get("default_sort") ?? "");
    const version = String(form.get("version") ?? "");
    const copy = Object.fromEntries(copyFields.map(([key]) => [key, String(form.get(key) ?? "").trim()]));
    const invalidCopy = copyFields.find(([key]) => !copy[key] || copy[key].length > copyLimit || copy[key].includes("\0"));
    if (invalidCopy) return { error: `${invalidCopy[1]} must be 1–${copyLimit} characters.` };
    if (!/^[A-Z]{3}$/.test(currencyCode) || !Object.hasOwn(sortOptions, sort) || !/^\d{1,18}$/.test(version)) {
      return { error: "Enter a three-letter currency code and select a valid sort order." };
    }

    const sql = getDatabase();
    const [updated] = await sql`
      UPDATE site_settings SET site_name = ${name}, tagline = ${tagline}, site_description = ${description},
        menu_intro = ${intro}, currency_label = ${currencyLabel}, currency_code = ${currencyCode},
        default_sort = ${sort}, copy = ${JSON.stringify(copy)}::jsonb, version = version + 1
      WHERE id = 1 AND version = ${version}
      RETURNING version
    `;
    if (!updated) return { error: "Settings changed in another session. Reload the page and try again." };
    revalidatePath("/");
    revalidatePath("/admin");
    return { message: "Settings saved." };
  } catch {
    return { error: "Could not save settings. Try again." };
  }
}

