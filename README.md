# Saffron & Stone

Saffron & Stone is a restaurant website built with Next.js App Router, TypeScript,
Tailwind CSS, and Neon PostgreSQL. Visitors can browse the menu. Signed-in
customers can reserve a table, place a food order, and update their order for
five minutes. Administrators manage menu items and site settings and can see
upcoming table assignments.

## Local setup

1. Use Node.js 24 and run `npm ci`.
2. Create `.env.local` with `DATABASE_URL` set to your Neon connection string.
3. In Neon, create the base menu table if this is a fresh database.

   ```sql
   CREATE TABLE IF NOT EXISTS menu_items (
     id bigserial PRIMARY KEY,
     name varchar(150) NOT NULL,
     price numeric(10,2) NOT NULL CHECK (price >= 0),
     description text NOT NULL DEFAULT '',
     created_at timestamptz DEFAULT now()
   );
   ```

4. Apply `db/001-accounts-settings.sql` once. If existing dishes share a name
   after trimming and converting it to lowercase, resolve those conflicts
   before applying the migration.
5. Apply `db/002-bookings-orders-recovery.sql` once. It seeds four sample
   tables. Table labels, capacities, and active status are stored in
   `restaurant_tables`.
6. To create the first admin, set `BOOTSTRAP_ADMIN_USERNAME`,
   `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` in the local
   environment. Run `node --env-file=.env.local scripts/bootstrap-admin.mjs`
   and remove the bootstrap variables afterward.
7. Run `npm run dev` and open `http://localhost:3000`.

Keep `.env.local` out of Git. If a deployment proxy changes the origin seen by
the application, set `APP_ORIGIN` to the public origin without a trailing
slash. Production session cookies require HTTPS.

## Pages and access

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Restaurant information and a searchable, sortable menu |
| `/register` | Signed out | Create a customer account |
| `/login` | Signed out | Sign in as a customer or admin |
| `/account` | Signed in | Update username, email or password, and sign out |
| `/recover` | Public | Generate a recovery code while signed in, or reset while signed out |
| `/dining` | Signed in | Book a table and manage orders for your own bookings |
| `/admin` | Admin | Change site settings, open menu management, and view upcoming reservations |

Menu reads use `GET /api/menu`. Menu writes use `POST /api/menu` and
`PATCH` or `DELETE /api/menu/:id`. Writes require an admin session and the
application's expected origin. Settings changes require an admin session.

## Data and behaviour

- PostgreSQL stores dishes, accounts, sessions, site settings, table inventory,
  bookings, and orders. Dish names, usernames, and emails have database
  uniqueness rules.
- The admin settings form updates branding, homepage copy, currency display,
  and the default menu sort. Changing the currency setting does not convert
  stored dish prices.
- Reservations start on the hour, run for one hour, and can be made up to
  30 days ahead. Times are shown in Pakistan time. The database prevents
  conflicting reservations for the same table and duplicate slots for the
  same account.
- Orders belong to a booking. A booking can exist without an order. The
  server takes ownership from the current session and PostgreSQL prices
  selected dishes from the menu. The saved order keeps dish names, quantities,
  prices, currency, and the total so it can still display after a dish is deleted.
  Saving an edit uses current menu prices for the updated selection.
- PostgreSQL creates the order timestamp and checks the five-minute deadline
  using its own clock. The order version prevents a stale form from silently
  overwriting a newer edit.
- Usernames are case-insensitive. Passwords are hashed with scrypt and use
  the same validation rules for registration, changes, and recovery.
- Set up password recovery while signed in via `/account`. A saved recovery
  code can be used once and expires after 180 days. Resetting the password
  invalidates older sessions. Generate a fresh recovery code after signing
  back in. Users who have never generated a code cannot self-recover using
  this flow.

## Verification

Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

- Register a customer, sign in using a different capitalisation of the
  username, and check that the customer cannot change menu items or open
  admin settings.
- Sign in as two customers in separate browser profiles. Try to reserve the
  same table at the same hour from both. Only one booking should succeed.
- Place an order and verify the booking, dishes, quantities, and total after
  refreshing. Check that another customer cannot view or edit that booking.
- Edit an order immediately. Then retry from an already-open edit form
  after five minutes, including with the device clock moved backward.
  The database should reject the second edit.
- Generate a recovery code, sign out, and reset the password. Verify that
  the previous password and code fail, an older session no longer works,
  and the new password signs in.
- As an admin, check that an upcoming reservation shows the booked table
  and the customer's username.