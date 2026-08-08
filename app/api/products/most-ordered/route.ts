import { NextResponse } from "next/server";
import connectDB from "@/config/DBConnect";
import Product from "@/config/models/product";

export async function GET(request: Request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "12");
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 12;

    const products = await Product.find({ published: true })
      .sort({ orderFrequency: -1, _id: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    return NextResponse.json({
      success: true,
      products,
      hasMore: products.length === safeLimit,
      page: safePage,
    });
  } catch (error) {
    console.error("Most ordered products API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch most ordered products",
      },
      { status: 500 }
    );
  }
}
