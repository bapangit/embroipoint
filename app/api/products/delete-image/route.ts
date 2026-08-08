import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/config/DBConnect";
import Product from "@/config/models/product";
import { deleteFromCloudinary } from "@/lib/cloudinary";

type ImageField = "image1" | "image2" | "image3" | "image4" | "image5";
const imageFields: ImageField[] = ["image1", "image2", "image3", "image4", "image5"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      imageField,
      imageUrl,
      clearProductImage = false,
    }: {
      productId?: string;
      imageField?: ImageField;
      imageUrl?: string;
      clearProductImage?: boolean;
    } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, message: "Image URL is required" },
        { status: 400 },
      );
    }

    if (clearProductImage && (!productId || !imageField || !imageFields.includes(imageField))) {
      return NextResponse.json(
        { success: false, message: "Product ID and image field are required" },
        { status: 400 },
      );
    }

    await deleteFromCloudinary(imageUrl);

    if (clearProductImage && productId && imageField) {
      await connectDB();
      await Product.findOneAndUpdate(
        {
          _id: productId,
          [imageField]: imageUrl,
        },
        {
          [imageField]: "",
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete image",
      },
      {
        status: 500,
      },
    );
  }
}
