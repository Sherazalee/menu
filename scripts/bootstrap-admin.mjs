import { neon } from "@neondatabase/serverless";
import { validateCredentials } from "../src/lib/credentials.mjs";
import { hashPassword } from "../src/lib/password.mjs";

const { DATABASE_URL, BOOTSTRAP_ADMIN_USERNAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD } = process.env;
const username = BOOTSTRAP_ADMIN_USERNAME?.trim().toLowerCase() ?? "";
const email = BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
const password = BOOTSTRAP_ADMIN_PASSWORD ?? "";
const validation = validateCredentials(username, email, password);

if (!DATABASE_URL || validation) {
  console.error(!DATABASE_URL ? "DATABASE_URL is required." : validation);
  process.exitCode = 1;
} else {
  try {
    const sql = neon(DATABASE_URL);
    const hash = await hashPassword(password);
    const [, inserted] = await sql.transaction([
      sql`LOCK TABLE accounts IN SHARE ROW EXCLUSIVE MODE`,
      sql`INSERT INTO accounts (username, email, password_hash, role)
          SELECT ${username}, ${email}, ${hash}, 'admin'
          WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE role = 'admin')
          ON CONFLICT DO NOTHING RETURNING id`,
    ]);
    if (!inserted.length) {
      console.error("An admin already exists or the username or email is in use.");
      process.exitCode = 1;
    } else {
      console.log("Initial admin created.");
    }
  } catch {
    console.error("Admin initialization failed. Check the database configuration and migration.");
    process.exitCode = 1;
  }
}

