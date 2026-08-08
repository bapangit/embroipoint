import { NextResponse } from "next/server";
import connectDB from "@/config/DBConnect";
import Product from "@/config/models/product";

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({ published: false }).sort({ _id: -1 }).lean();

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Drafts API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch drafts",
      },
      { status: 500 }
    );
  }
}