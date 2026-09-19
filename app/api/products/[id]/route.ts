import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";

export const dynamic = "force-dynamic";


type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = params;
    const product = getProduct(id);

    if (!product) {
      return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PRODUCT_READ_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
