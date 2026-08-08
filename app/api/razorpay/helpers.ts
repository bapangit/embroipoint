import connectDB from "@/config/DBConnect";
import Address from "@/config/models/address";
import Product from "@/config/models/product";
import User from "@/config/models/user";
import { DELIVERY_FEE } from "@/config/orderPricing";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export const availableSizes = ["S", "M", "L", "XL", "XXL"];

type UserDocument = {
  _id: unknown;
  selectedAddress?: string;
  orderIds?: string[];
  save: () => Promise<unknown>;
};

type ProductDocument = {
  _id: unknown;
  price?: string;
  title?: string;
};

type AddressDocument = {
  _id: unknown;
  name?: string;
  ph?: string;
  pin?: string;
  at?: string;
  po?: string;
  dist?: string;
  state?: string;
};

export type CheckoutContext = {
  user: UserDocument;
  product: ProductDocument;
  selectedAddress: AddressDocument;
  totalAmount: number;
};

export const parsePrice = (value?: string) => {
  const price = Number((value || "").replace(/[^0-9.]/g, ""));

  return Number.isFinite(price) ? price : 0;
};

export const formatPrice = (value: number) => `Rs. ${value.toFixed(2)}`;

export function getSavedOrderIds(user: { orderIds?: string[] }) {
  return Array.from(
    new Set(
      (Array.isArray(user.orderIds) ? user.orderIds : [])
        .filter((orderId): orderId is string => Boolean(orderId))
        .map((orderId) => String(orderId))
    )
  );
}

export async function getCheckoutContext(
  productId: string,
  size: string
): Promise<CheckoutContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new Error("You must be signed in to place an order.");
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product.");
  }

  if (!availableSizes.includes(size)) {
    throw new Error("Invalid size.");
  }

  await connectDB();

  const user = (await User.findOne({
    email: session.user.email,
  })) as UserDocument | null;

  if (!user) {
    throw new Error("User was not found.");
  }

  const product = (await Product.findById(productId)) as ProductDocument | null;

  if (!product) {
    throw new Error("Product not found.");
  }

  const selectedAddressId = user.selectedAddress
    ? String(user.selectedAddress)
    : "";

  if (!mongoose.Types.ObjectId.isValid(selectedAddressId)) {
    throw new Error("Select a delivery address before confirming your order.");
  }

  const selectedAddress = (await Address.findOne({
    _id: selectedAddressId,
    userId: String(user._id),
  })) as AddressDocument | null;

  if (!selectedAddress) {
    throw new Error("Selected delivery address was not found.");
  }

  return {
    user,
    product,
    selectedAddress,
    totalAmount: parsePrice(product.price) + DELIVERY_FEE,
  };
}
