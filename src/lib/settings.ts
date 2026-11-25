import { cache } from "react";
import { getDatabase } from "./db";

export const sortOptions = {
  newest: "Newest first",
  az: "Name A–Z",
  low: "Price: Low to High",
  high: "Price: High to Low",
};

export const settingFields = [
  ["site_name", "Site name", 80],
  ["tagline", "Tagline", 80],
  ["site_description", "Search description", 300],
  ["menu_intro", "Menu introduction", 300],
  ["currency_label", "Price prefix", 12],
  ["currency_code", "Currency code", 3],
] as const;

export const copyFields = [
  ["heroEyebrow", "Hero eyebrow"],
  ["heroHeading", "Hero title"],
  ["heroAccent", "Hero title accent"],
  ["heroBody", "Hero description"],
  ["plateLabel", "Hero illustration text"],
  ["plateCaption", "Hero illustration caption"],
  ["freshBadge", "Freshness badge"],
  ["greetingBadge", "Greeting badge"],
  ["featureOne", "First feature"],
  ["featureTwo", "Second feature"],
  ["featureThree", "Third feature"],
  ["storyEyebrow", "Story eyebrow"],
  ["storyHeading", "Story title"],
  ["storyAccent", "Story title accent"],
  ["storyBody", "Story description"],
  ["storyCaption", "Story caption"],
  ["menuEyebrow", "Menu eyebrow"],
  ["menuCaption", "Menu caption"],
  ["closingHeading", "Closing title"],
  ["closingAccent", "Closing title accent"],
  ["closingBody", "Closing description"],
  ["footerNote", "Footer note"],
] as const;

export const copyLimit = 300;
type CopySetting = (typeof copyFields)[number][0];
type TextSetting = (typeof settingFields)[number][0];
export type SiteSettings = Record<TextSetting, string> & {
  copy: Record<CopySetting, string>;
  default_sort: keyof typeof sortOptions;
  version: string;
};

export const getSettings = cache(async () => {
  const sql = getDatabase();
  const [settings] = await sql`
    SELECT site_name, tagline, site_description, menu_intro, currency_label,
      currency_code, default_sort, copy, version FROM site_settings WHERE id = 1
  `;
  if (!settings) throw new Error("Site settings are missing. Apply the database migration.");
  return settings as SiteSettings;
});

