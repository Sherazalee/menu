
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: Context
) {
  try {
    const { id } = await context.params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid item ID." },
        { status: 400 }
      );
    }

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
        { success: false, error: "Please enter valid details." },
        { status: 400 }
      );
    }

    const sql = getDatabase();

    const result = await sql`
      UPDATE menu_items
      SET
        name = ${name},
        price = ${price},
        description = ${description}
      WHERE id = ${id}
      RETURNING id, name, price, description
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: result[0],
    });
  } catch (error) {
    console.error("PATCH menu error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update item." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: Context
) {
  try {
    const { id } = await context.params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid item ID." },
        { status: 400 }
      );
    }

    const sql = getDatabase();

    const deleted = await sql`
      DELETE FROM menu_items
      WHERE id = ${id}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: "Item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE menu error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete item." },
      { status: 500 }
    );
  }
}
