import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { authorizeMenuWrite, duplicateDish, menuError, readDish, validDishId } from "@/lib/menu-write";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await authorizeMenuWrite(request);
    if (denied) return denied;
    const { id } = await params;
    if (!validDishId(id)) return menuError("Invalid item ID.", 400);
    const dish = await readDish(request);
    if (!dish) return menuError("Enter a dish name, description, and valid price with up to two decimal places.", 400);
    const { name, price, description } = dish;
    const sql = getDatabase();
    const [existing] = await sql`
      SELECT id FROM menu_items WHERE id <> ${id} AND lower(btrim(name)) = lower(btrim(${name}))
    `;
    if (existing) return menuError("A dish with that name already exists.", 409);
    const [item] = await sql`
      UPDATE menu_items SET name = ${name}, price = ${price}, description = ${description}
      WHERE id = ${id} RETURNING id, name, price, description
    `;
    if (!item) return menuError("Item not found.", 404);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    if (duplicateDish(error)) return menuError("A dish with that name already exists.", 409);
    console.error("PATCH menu error:", error);
    return menuError("Failed to update item.", 500);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const denied = await authorizeMenuWrite(request);
    if (denied) return denied;
    const { id } = await params;
    if (!validDishId(id)) return menuError("Invalid item ID.", 400);
    const sql = getDatabase();
    const [deleted] = await sql`DELETE FROM menu_items WHERE id = ${id} RETURNING id`;
    if (!deleted) return menuError("Item not found.", 404);
    return NextResponse.json({ success: true, message: "Menu item deleted successfully." });
  } catch (error) {
    console.error("DELETE menu error:", error);
    return menuError("Failed to delete menu item.", 500);
  }
}
