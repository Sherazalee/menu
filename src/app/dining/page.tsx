import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/app/account/forms";
import { AccountShell } from "@/app/account/shell";
import { currentAccount } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { bookTable, saveOrder } from "./actions";

type OrderLine = {
  id: string;
  name: string;
  unitPrice: string;
  qty: number;
};

const bookingTime = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Karachi",
});

function dateLabel(value: string | Date) {
  return `${bookingTime.format(new Date(value))} PKT`;
}

function amount(value: string | number, prefix: string) {
  return `${prefix} ${Number(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function DiningPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const account = await currentAccount();
  if (!account) redirect("/login");

  const sql = getDatabase();
  const [query, settings, tables, dishes, bookings, staffBookings] = await Promise.all([
    searchParams,
    getSettings(),
    sql`
      SELECT id::text AS id, label, capacity
      FROM restaurant_tables WHERE active ORDER BY id
    `,
    sql`
      SELECT id::text AS id, name, price::text AS price
      FROM menu_items ORDER BY name, id
    `,
    sql`
      SELECT b.id::text AS id, b.starts_at, b.guest_count, t.label,
             o.id::text AS order_id, o.items, o.total::text AS total,
             o.currency_label, o.currency_code, o.created_at AS order_created_at,
             o.created_at + interval '5 minutes' AS editable_until,
             o.version::text AS version,
             coalesce(clock_timestamp() < o.created_at + interval '5 minutes', false) AS can_edit,
             clock_timestamp() < b.starts_at + interval '1 hour' AS can_order
      FROM table_bookings b
      JOIN restaurant_tables t ON t.id = b.table_id
      LEFT JOIN dining_orders o ON o.booking_id = b.id
      WHERE b.account_id = ${account.id}
      ORDER BY b.starts_at DESC, b.id DESC
    `,
    account.role === "admin"
      ? sql`
          SELECT b.id::text AS id, b.starts_at, b.guest_count, t.label, a.username
          FROM table_bookings b
          JOIN restaurant_tables t ON t.id = b.table_id
          JOIN accounts a ON a.id = b.account_id
          WHERE b.starts_at + interval '1 hour' > clock_timestamp()
          ORDER BY b.starts_at, t.label
        `
      : Promise.resolve([]),
  ]);

  return (
    <AccountShell title="Table bookings and orders">
      <div className="mt-4">
        <Link href="/account" className="underline">Your account</Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Book a table</h2>
        <p className="mt-2 text-sm">
          Book a one-hour slot within the next 30 days. Times are in Pakistan time.
        </p>

        {tables.length === 0 ? <p className="mt-4">No tables are currently available.</p> : (
          <ActionForm action={bookTable} submit="Book table">
            <label className="block">
              <span className="form-label">Table</span>
              <select name="tableId" className="form-input" required defaultValue="">
                <option value="" disabled>Choose a table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.label} · seats {table.capacity}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="form-label">Start time (PKT, on the hour)</span>
              <input
                name="startsAt"
                type="datetime-local"
                className="form-input"
                step={3600}
                required
              />
            </label>

            <label className="block">
              <span className="form-label">Number of guests</span>
              <input
                name="guests"
                type="number"
                className="form-input"
                min={1}
                max={20}
                step={1}
                defaultValue={2}
                required
              />
            </label>
          </ActionForm>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Your bookings</h2>
        {bookings.length === 0 && <p className="mt-3">You have no bookings yet.</p>}

        <div className="mt-4 space-y-5">
          {bookings.map((booking) => {
            const lines = (booking.items ?? []) as OrderLine[];
            const orderedQuantities = new Map(lines.map((line) => [line.id, line.qty]));
            const hasOrder = Boolean(booking.order_id);
            const showForm = dishes.length > 0 && (hasOrder ? booking.can_edit : booking.can_order);

            let confirmation = "";
            if (query.booked === booking.id) confirmation = "Your table is booked.";
            if (hasOrder && query.ordered === booking.id) confirmation = "Your order is confirmed.";
            if (hasOrder && query.edited === booking.id) confirmation = "Your order was updated.";

            return (
              <article
                key={booking.id}
                id={`booking-${booking.id}`}
                className="rounded-2xl border border-[#DCD5C8] p-5"
              >
                {confirmation && (
                  <p role="status" className="mb-3 rounded-lg bg-[#E4EBDF] p-3">
                    {confirmation}
                  </p>
                )}

                <h3 className="font-display text-xl">
                  Booking #{booking.id} · {booking.label}
                </h3>
                <p className="mt-2 text-sm">
                  {dateLabel(booking.starts_at)} · {booking.guest_count} guest(s)
                </p>

                {hasOrder && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold">Order #{booking.order_id}</h4>
                    <p className="text-sm">Placed {dateLabel(booking.order_created_at)}</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {lines.map((line) => (
                        <li key={line.id}>
                          {line.qty} × {line.name} at {amount(line.unitPrice, booking.currency_label)}
                        </li>
                      ))}
                    </ul>
                    <p className="font-semibold">
                      Total {amount(booking.total, booking.currency_label)} ({booking.currency_code})
                    </p>
                    <p className="text-sm">
                      {booking.can_edit
                        ? `Edit by ${dateLabel(booking.editable_until)}.`
                        : "The five-minute order edit window has closed."}
                    </p>
                  </div>
                )}

                {showForm && (
                  <details className="mt-5">
                    <summary className="cursor-pointer font-semibold">
                      {hasOrder ? "Edit dishes" : "Select dishes and order"}
                    </summary>
                    <ActionForm
                      key={`${booking.id}-${booking.version ?? "new"}`}
                      action={saveOrder}
                      submit={hasOrder ? "Save order changes" : "Place order"}
                    >
                      <input type="hidden" name="bookingId" value={booking.id} readOnly />
                      <input type="hidden" name="version" value={booking.version ?? ""} readOnly />
                      <p className="text-sm">
                        Quantities of zero leave a dish out. The order uses current menu prices when saved.
                      </p>
                      {dishes.map((dish) => (
                        <label key={dish.id} className="flex items-center justify-between gap-3">
                          <span>
                            {dish.name} · {amount(
                              dish.price,
                              hasOrder ? booking.currency_label : settings.currency_label,
                            )}
                          </span>
                          <input
                            name={`qty:${dish.id}`}
                            type="number"
                            className="form-input max-w-24"
                            min={0}
                            max={20}
                            step={1}
                            defaultValue={orderedQuantities.get(dish.id) ?? 0}
                          />
                        </label>
                      ))}
                    </ActionForm>
                  </details>
                )}

                {!hasOrder && !booking.can_order && (
                  <p className="mt-4 text-sm">Ordering has closed for this booking.</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {account.role === "admin" && (
        <section className="mt-10" id="staff-bookings">
          <h2 className="font-display text-2xl">Upcoming table reservations</h2>
          {staffBookings.length === 0 ? <p className="mt-3">No upcoming reservations.</p> : (
            <ul className="mt-4 divide-y divide-[#DCD5C8]">
              {staffBookings.map((booking) => (
                <li key={booking.id} className="py-3 text-sm">
                  {booking.label} · {dateLabel(booking.starts_at)} · {booking.guest_count} guest(s)
                  <span className="block">Booked by {booking.username}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </AccountShell>
  );
}