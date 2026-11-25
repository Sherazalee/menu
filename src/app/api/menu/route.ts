import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { authorizeMenuWrite, duplicateDish, menuError, readDish } from "@/lib/menu-write";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDatabase();
    const items = await sql`
      SELECT id, name, price, description FROM menu_items ORDER BY id DESC
    `;
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("GET menu error:", error);
    return menuError("Failed to load menu.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const denied = await authorizeMenuWrite(request);
    if (denied) return denied;
    const dish = await readDish(request);
    if (!dish) return menuError("Enter a dish name, description, and valid price with up to two decimal places.", 400);
    const { name, price, description } = dish;
    const sql = getDatabase();
    const [existing] = await sql`
      SELECT id FROM menu_items WHERE lower(btrim(name)) = lower(btrim(${name}))
    `;
    if (existing) return menuError("A dish with that name already exists.", 409);
    const [item] = await sql`
      INSERT INTO menu_items (name, price, description)
      VALUES (${name}, ${price}, ${description})
      RETURNING id, name, price, description
    `;
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    if (duplicateDish(error)) return menuError("A dish with that name already exists.", 409);
    console.error("POST menu error:", error);
    return menuError("Failed to add menu item.", 500);
  }
}
