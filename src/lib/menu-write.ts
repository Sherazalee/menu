import { NextResponse } from "next/server";
import { currentAccount } from "./auth";

export async function authorizeMenuWrite(request: Request) {
  const account = await currentAccount();
  if (!account) return menuError("Sign in to manage the menu.", 401);
  if (account.role !== "admin") return menuError("Admin access is required.", 403);

  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.APP_ORIGIN ?? new URL(request.url).origin;
  if (request.headers.get("sec-fetch-site") === "cross-site" || origin !== expectedOrigin) {
    return menuError("Menu changes require a same-origin request.", 403);
  }
  return null;
}

export function menuError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function readDish(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return null;
  const { name, description, price: rawPrice } = body as Record<string, unknown>;
  const priceText = typeof rawPrice === "number" || typeof rawPrice === "string" ? String(rawPrice).trim() : "";
  const price = Number(priceText);
  if (typeof name !== "string" || !name.trim() || name.trim().length > 150 ||
      typeof description !== "string" || !description.trim() ||
      !/^\d+(?:\.\d{1,2})?$/.test(priceText) || !Number.isFinite(price) ||
      price > 99999999.99) return null;
  return { name: name.trim(), description: description.trim(), price };
}

export function validDishId(id: string) {
  return /^\d{1,19}$/.test(id) && BigInt(id) > BigInt(0) && BigInt(id) <= BigInt("9223372036854775807");
}

export function duplicateDish(error: unknown) {
  return (error as { code?: string; constraint?: string })?.code === "23505" &&
    (error as { constraint?: string }).constraint === "menu_items_normalized_name_key";
}

