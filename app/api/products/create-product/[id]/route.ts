import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import connectDB from "@/config/DBConnect";
import Product from "@/config/models/product";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { getProductPath } from "@/lib/productUrl";

type ProductImages = {
  _id: string | { toString(): string };
  title?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
};

const getProductImageUrls = (product: ProductImages) =>
  [
    product.image1,
    product.image2,
    product.image3,
    product.image4,
    product.image5,
  ].filter((imageUrl): imageUrl is string =>
    Boolean(imageUrl && imageUrl.trim() && imageUrl.startsWith("http")),
  );

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const product = await Product.findById(id).lean();

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const body = await req.json();

    const { id } = await params;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        ...body
      },
      {
        new: true,
      }
    );

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/most-ordered");
    revalidatePath(`/product/${id}`);
    if (product) {
      revalidatePath(getProductPath(product));
    }
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save product",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const product = await Product.findById(id).lean<ProductImages | null>();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    const imageUrls = getProductImageUrls(product);

    await Promise.all(imageUrls.map((imageUrl) => deleteFromCloudinary(imageUrl)));
    await Product.findByIdAndDelete(id);

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/most-ordered");
    revalidatePath(`/product/${id}`);
    revalidatePath(getProductPath(product));
    revalidatePath("/sitemap.xml");

    return NextResponse.json({
      success: true,
      message: "Product and images deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
      },
      {
        status: 500,
      }
    );
  }
}
