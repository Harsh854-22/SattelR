import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const products = category
      ? PRODUCTS.filter((p) => p.category.toLowerCase() === category.toLowerCase())
      : PRODUCTS;

    return NextResponse.json({ products });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PRODUCTS_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
