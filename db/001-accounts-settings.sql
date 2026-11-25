BEGIN;

-- Resolve duplicate names before running this migration.
CREATE UNIQUE INDEX menu_items_normalized_name_key ON menu_items (lower(btrim(name)));

CREATE TABLE accounts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,32}$'),
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND length(email) <= 254),
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  credential_version bigint NOT NULL DEFAULT 0
);

CREATE TABLE account_sessions (
  token_hash text PRIMARY KEY,
  account_id bigint NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  credential_version bigint NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX account_sessions_expiry_idx ON account_sessions (expires_at);

CREATE TABLE auth_attempts (
  scope text NOT NULL,
  identity text NOT NULL,
  window_start bigint NOT NULL,
  attempts integer NOT NULL,
  PRIMARY KEY (scope, identity)
);

CREATE TABLE site_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  site_name text NOT NULL CHECK (length(btrim(site_name)) BETWEEN 1 AND 80),
  tagline text NOT NULL CHECK (length(btrim(tagline)) BETWEEN 1 AND 80),
  site_description text NOT NULL CHECK (length(btrim(site_description)) BETWEEN 1 AND 300),
  menu_intro text NOT NULL CHECK (length(btrim(menu_intro)) BETWEEN 1 AND 300),
  currency_label text NOT NULL CHECK (length(btrim(currency_label)) BETWEEN 1 AND 12),
  currency_code text NOT NULL CHECK (currency_code ~ '^[A-Z]{3}$'),
  default_sort text NOT NULL CHECK (default_sort IN ('newest', 'az', 'low', 'high')),
  copy jsonb NOT NULL CHECK (jsonb_typeof(copy) = 'object'),
  version bigint NOT NULL DEFAULT 0
);
INSERT INTO site_settings
  (id, site_name, tagline, site_description, menu_intro, currency_label, currency_code, default_sort, copy)
VALUES
  (1, 'Saffron & Stone', 'The Dining House',
   'Discover the menu at Saffron & Stone. Fresh ingredients, thoughtful flavours, and memorable dining.',
   'Discover dishes worth coming back for. Made fresh, served with care, and always full of flavour.',
   'Rs.', 'PKR', 'newest', $copy$
{
  "heroEyebrow": "A table worth gathering around",
  "heroHeading": "Good food.",
  "heroAccent": "Great company.",
  "heroBody": "Fresh ingredients, thoughtful flavours, and a little something special in every bite. Pull up a chair. There's always room at our table.",
  "plateLabel": "Made with\nlove.",
  "plateCaption": "Since Day One",
  "freshBadge": "Fresh daily",
  "greetingBadge": "Bon appétit!",
  "featureOne": "Thoughtfully prepared",
  "featureTwo": "Fresh & flavourful",
  "featureThree": "Made to share",
  "storyEyebrow": "01 / Our Philosophy",
  "storyHeading": "More than",
  "storyAccent": "just a meal.",
  "storyBody": "We believe the best moments happen around a table. Beautifully simple food, made with care, brings people together.",
  "storyCaption": "Honest ingredients. Memorable flavours.",
  "menuEyebrow": "02 / From Our Kitchen",
  "menuCaption": "Crafted with care, served with love",
  "closingHeading": "Come hungry.",
  "closingAccent": "Leave happy.",
  "closingBody": "The best conversations start with good food. We've saved you a seat.",
  "footerNote": "A restaurant menu powered by Next.js & NeonDB."
}
$copy$::jsonb);

COMMIT;

