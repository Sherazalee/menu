
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDatabase();

    const items = await sql`
      SELECT id, name, price, description
      FROM menu_items
      ORDER BY id DESC
    `;

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("GET menu error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load menu." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const rawPrice = body.price;
    const price = Number(rawPrice);

    if (
      !name ||
      name.length > 150 ||
      !description ||
      rawPrice === "" ||
      rawPrice === null ||
      rawPrice === undefined ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 99999999.99
    ) {
      return NextResponse.json(
        { success: false, error: "Please enter valid item details." },
        { status: 400 }
      );
    }

    const sql = getDatabase();

    const result = await sql`
      INSERT INTO menu_items (name, price, description)
      VALUES (${name}, ${price}, ${description})
      RETURNING id, name, price, description
    `;

    return NextResponse.json(
      { success: true, item: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST menu error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to add menu item." },
      { status: 500 }
    );
  }
}
