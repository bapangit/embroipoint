import ProductImageSlider from "@/app/components/ProductImageSlider";
import connectDB from "@/config/DBConnect";
import Address from "@/config/models/address";
import Order from "@/config/models/orders";
import Product from "@/config/models/product";
import User from "@/config/models/user";
import { DELIVERY_FEE } from "@/config/orderPricing";
import mongoose from "mongoose";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import OrderCheckoutForm from "./OrderCheckoutForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Checkout",
  robots: {
    index: false,
    follow: false,
  },
};

type OrderPageProps = {
  searchParams: Promise<{
    productId?: string;
    size?: string;
    orderId?: string;
  }>;
};

type ProductRecord = {
  _id: string;
  title?: string;
  price?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
};

type AddressRecord = {
  _id: string;
  name?: string;
  ph?: string;
  pin?: string;
  at?: string;
  po?: string;
  dist?: string;
  state?: string;
};

const availableSizes = ["S", "M", "L", "XL", "XXL"];

const parsePrice = (value?: string) => {
  const price = Number((value || "").replace(/[^0-9.]/g, ""));

  return Number.isFinite(price) ? price : 0;
};

const formatPrice = (value: number) => `Rs. ${value.toFixed(2)}`;

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getSavedOrderIds(user: { orderIds?: string[] }) {
  return Array.from(
    new Set(
      (Array.isArray(user.orderIds) ? user.orderIds : [])
        .filter((orderId): orderId is string => Boolean(orderId))
        .map((orderId) => String(orderId))
    )
  );
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  await connectDB();
  return User.findOne({ email: session.user.email });
}

async function getProductById(id: string): Promise<ProductRecord | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const product = await Product.findById(id).lean<ProductRecord | null>();

  if (!product) {
    return null;
  }

  return {
    ...product,
    _id: String(product._id),
  };
}

async function getSelectedAddress(): Promise<AddressRecord | null> {
  const user = await getCurrentUser();
  const selectedAddressId = user?.selectedAddress
    ? String(user.selectedAddress)
    : "";

  if (!user || !mongoose.Types.ObjectId.isValid(selectedAddressId)) {
    return null;
  }

  const address = await Address.findOne({
    _id: selectedAddressId,
    userId: String(user._id),
  }).lean<AddressRecord | null>();

  if (!address) {
    return null;
  }

  return {
    ...address,
    _id: String(address._id),
  };
}

async function confirmOrder(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  const productId = readRequiredField(formData, "productId");
  const size = readRequiredField(formData, "size");
  const paymentMethod = readRequiredField(formData, "paymentMethod");

  if (!user) {
    throw new Error("You must be signed in to confirm an order.");
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product.");
  }

  if (!availableSizes.includes(size)) {
    throw new Error("Invalid size.");
  }

  if (paymentMethod !== "Cash On Delivery") {
    throw new Error("Use the Razorpay checkout button for online payments.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  const selectedAddressId = user.selectedAddress
    ? String(user.selectedAddress)
    : "";

  if (!mongoose.Types.ObjectId.isValid(selectedAddressId)) {
    throw new Error("Select a delivery address before confirming your order.");
  }

  const selectedAddress = await Address.findOne({
    _id: selectedAddressId,
    userId: String(user._id),
  });

  if (!selectedAddress) {
    throw new Error("Selected delivery address was not found.");
  }

  const order = await Order.create({
    user: String(user._id),
    productId,
    addressId: String(selectedAddress._id),
    address: {
      name: selectedAddress.name,
      ph: selectedAddress.ph,
      pin: selectedAddress.pin,
      at: selectedAddress.at,
      po: selectedAddress.po,
      dist: selectedAddress.dist,
      state: selectedAddress.state,
    },
    size,
    amount: formatPrice(parsePrice(product.price) + DELIVERY_FEE),
    paymentMethod,
    paymentStatus: "pending",
  });

  await Product.updateOne(
    { _id: productId },
    { $inc: { orderFrequency: 1 } }
  );

  user.orderIds = [...getSavedOrderIds(user), String(order._id)];
  await user.save();

  revalidatePath("/order");
  redirect(
    `/order?${new URLSearchParams({
      productId,
      size,
      orderId: String(order._id),
    }).toString()}`
  );
}

export default async function OrderPage({ searchParams }: OrderPageProps) {
  const { productId, size, orderId } = await searchParams;

  if (!productId || !size || !availableSizes.includes(size)) {
    notFound();
  }

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const productPrice = parsePrice(product.price);
  const totalPrice = productPrice + DELIVERY_FEE;
  const selectedAddress = await getSelectedAddress();
  const orderPath = `/order?${new URLSearchParams({
    productId,
    size,
  }).toString()}`;
  const addressPath = `/address?${new URLSearchParams({
    returnTo: orderPath,
  }).toString()}`;

  return (
    <main className={styles.pageShell}>
      <section className={styles.container}>
        <h1 className={styles.heading}>Order Summary</h1>

        {orderId ? (
          <p className={styles.successMessage}>Order confirmed successfully.</p>
        ) : null}

        <OrderCheckoutForm
          action={confirmOrder}
          productId={productId}
          productTitle={product.title || "Untitled Product"}
          size={size}
          productPrice={productPrice}
          deliveryFee={DELIVERY_FEE}
          totalPrice={totalPrice}
          selectedAddress={
            selectedAddress
              ? {
                  name: selectedAddress.name,
                  ph: selectedAddress.ph,
                }
              : null
          }
          orderId={orderId}
        >
          <div className={styles.detailsColumn}>
            <div className={styles.productPanel}>
              <div className={styles.imageWrapper}>
                <ProductImageSlider
                  image1={product.image1}
                  image2={product.image2}
                  image3={product.image3}
                  image4={product.image4}
                  image5={product.image5}
                  alt={product.title || "Product image"}
                  height="100%"
                  borderRadius="8px"
                />
              </div>
              <div className={styles.productInfo}>
                <h2>{product.title || "Untitled Product"}</h2>
                <p>Size: {size}</p>
              </div>
            </div>

            <section className={styles.addressPanel}>
              <div className={styles.panelHeader}>
                <h2>Delivery Address</h2>
                <Link className={styles.changeLink} href={addressPath}>
                  Change
                </Link>
              </div>
              {selectedAddress ? (
                <div className={styles.addressDetails}>
                  <h3>{selectedAddress.name || "Unnamed address"}</h3>
                  <p>{selectedAddress.at}</p>
                  <p>
                    {selectedAddress.po}, {selectedAddress.dist}
                  </p>
                  <p>
                    {selectedAddress.state} - {selectedAddress.pin}
                  </p>
                  <p>Phone: {selectedAddress.ph}</p>
                </div>
              ) : (
                <div className={styles.emptyAddress}>
                  <p>No delivery address selected.</p>
                  <Link className={styles.primaryLink} href={addressPath}>
                    Select Address
                  </Link>
                </div>
              )}
            </section>

          </div>
        </OrderCheckoutForm>
      </section>
    </main>
  );
}
