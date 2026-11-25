"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/app/account/actions";
import { currentAccount } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

const maxBigint = BigInt("9223372036854775807");

function validId(value: string) {
  return /^[1-9][0-9]{0,18}$/.test(value) && BigInt(value) <= maxBigint;
}

function bookingStart(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):00$/.test(value)) return null;

  const calendarCheck = new Date(`${value}:00Z`);
  if (!Number.isFinite(calendarCheck.getTime())) return null;
  if (calendarCheck.toISOString().slice(0, 16) !== value) return null;

  return new Date(`${value}:00+05:00`).toISOString();
}

export async function bookTable(_state: FormState, form: FormData): Promise<FormState> {
  const account = await currentAccount();
  if (!account) return { error: "Sign in to book a table." };

  const tableId = String(form.get("tableId") ?? "");
  const guests = String(form.get("guests") ?? "");
  const startsAt = bookingStart(String(form.get("startsAt") ?? ""));

  if (!validId(tableId) || !/^(?:[1-9]|1[0-9]|20)$/.test(guests) || !startsAt) {
    return { error: "Choose a table, a whole-hour start time, and a valid guest count." };
  }

  let bookingId: string;

  try {
    const sql = getDatabase();
    const [booking] = await sql`
      INSERT INTO table_bookings (account_id, table_id, starts_at, guest_count)
      SELECT ${account.id}, t.id, ${startsAt}::timestamptz, ${guests}::smallint
      FROM restaurant_tables t
      WHERE t.id = ${tableId} AND t.active AND t.capacity >= ${guests}::smallint
        AND ${startsAt}::timestamptz > clock_timestamp()
        AND ${startsAt}::timestamptz <= clock_timestamp() + interval '30 days'
      ON CONFLICT DO NOTHING
      RETURNING id::text AS id
    `;

    if (!booking) {
      return {
        error: "That slot could not be booked. Check the table capacity, choose a future time within 30 days, and try a different slot if needed.",
      };
    }

    bookingId = String(booking.id);
  } catch (error) {
    console.error("Booking failed", error instanceof Error ? error.name : "Unknown error");
    return { error: "Could not book the table. Try again." };
  }

  redirect(`/dining?booked=${bookingId}#booking-${bookingId}`);
}

export async function saveOrder(_state: FormState, form: FormData): Promise<FormState> {
  const account = await currentAccount();
  if (!account) return { error: "Sign in to place or edit an order." };

  const bookingId = String(form.get("bookingId") ?? "");
  const version = String(form.get("version") ?? "");

  if (!validId(bookingId) || (version !== "" && version !== "0" && !validId(version))) {
    return { error: "The booking or order is invalid. Reload the page." };
  }

  const quantities = new Map<string, number>();

  for (const [field, value] of form) {
    if (!field.startsWith("qty:") || value === "" || value === "0") continue;

    const id = field.slice(4);
    if (
      !validId(id) ||
      typeof value !== "string" ||
      !/^(?:[1-9]|1[0-9]|20)$/.test(value) ||
      quantities.has(id)
    ) {
      return { error: "Use a whole-number quantity from 0 to 20 for each dish." };
    }

    quantities.set(id, Number(value));
  }

  if (quantities.size < 1 || quantities.size > 20) {
    return { error: "Select between 1 and 20 different dishes." };
  }

  const items = Array.from(quantities, ([id, qty]) => ({ id, qty }));

  try {
    const sql = getDatabase();
    await sql`
      SELECT save_dining_order(
        ${account.id}::bigint,
        ${bookingId}::bigint,
        ${JSON.stringify(items)}::jsonb,
        ${version === "" ? null : version}::bigint
      )
    `;
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;

    switch (code) {
      case "P1001":
        return { error: "This booking is unavailable for ordering." };
      case "P1002":
        return { error: "This order has changed. Reload the page to see its current details." };
      case "P1003":
        return { error: "The five-minute edit window has closed." };
      case "P1004":
        return { error: "One or more dishes are unavailable. Reload the menu and try again." };
      default:
        console.error("Order save failed", code ?? "Unknown error");
        return { error: "Could not save the order. Try again." };
    }
  }

  const result = version === "" ? "ordered" : "edited";
  redirect(`/dining?${result}=${bookingId}#booking-${bookingId}`);
}