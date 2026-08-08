"use server";

import connectDB from "@/config/DBConnect";
import Cart from "@/config/models/cart";
import Product from "@/config/models/product";
import User from "@/config/models/user";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../../api/auth/[...nextauth]/route";

const availableSizes = ["S", "M", "L", "XL", "XXL"];

export async function addToCart(productId: string, size: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      ok: false,
      message: "Please sign in to add this item to your cart.",
    };
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return {
      ok: false,
      message: "Invalid product.",
    };
  }

  if (!availableSizes.includes(size)) {
    return {
      ok: false,
      message: "Select a size before adding this item to your cart.",
    };
  }

  await connectDB();

  const [user, product] = await Promise.all([
    User.findOne({ email: session.user.email }),
    Product.findById(productId).select("_id"),
  ]);

  if (!user) {
    return {
      ok: false,
      message: "Please sign in to add this item to your cart.",
    };
  }

  if (!product) {
    return {
      ok: false,
      message: "Product not found.",
    };
  }

  await Cart.findOneAndUpdate(
    {
      userId: String(user._id),
      productId,
      size,
    },
    {
      $setOnInsert: {
        userId: String(user._id),
        productId,
        size,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  revalidatePath("/cart");

  return {
    ok: true,
    message: "Added to cart.",
  };
}
