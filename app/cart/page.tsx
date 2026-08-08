import ProductImageSlider from "@/app/components/ProductImageSlider";
import connectDB from "@/config/DBConnect";
import Cart from "@/config/models/cart";
import Product from "@/config/models/product";
import User from "@/config/models/user";
import { getProductPath } from "@/lib/productUrl";
import mongoose from "mongoose";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { AiOutlineDelete } from "react-icons/ai";
import { authOptions } from "../api/auth/[...nextauth]/route";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Cart",
  robots: {
    index: false,
    follow: false,
  },
};

type CartRecord = {
  _id: mongoose.Types.ObjectId | string;
  productId?: string;
  size?: string;
  createdAt?: Date | string;
};

type ProductRecord = {
  _id: mongoose.Types.ObjectId | string;
  title?: string;
  price?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
};

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  await connectDB();
  return User.findOne({ email: session.user.email });
}

function formatDate(value?: Date | string) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function deleteCartItem(formData: FormData) {
  "use server";

  const user = await getCurrentUser();
  const cartId = readRequiredField(formData, "cartId");

  if (!user) {
    throw new Error("You must be signed in to delete cart items.");
  }

  if (!mongoose.Types.ObjectId.isValid(cartId)) {
    throw new Error("Invalid cart item.");
  }

  await Cart.deleteOne({
    _id: cartId,
    userId: String(user._id),
  });

  revalidatePath("/cart");
}

export default async function CartPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className={styles.pageShell}>
        <section className={styles.container}>
          <h1 className={styles.heading}>Cart</h1>
          <p className={styles.emptyText}>Please sign in to view your cart.</p>
        </section>
      </main>
    );
  }

  const cartItems = await Cart.find({ userId: String(user._id) })
    .sort({ createdAt: -1 })
    .lean<CartRecord[]>();
  const productIds = Array.from(
    new Set(
      cartItems
        .map((item) => item.productId)
        .filter(
          (productId): productId is string =>
            typeof productId === "string" &&
            mongoose.Types.ObjectId.isValid(productId)
        )
    )
  );
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).lean<ProductRecord[]>()
    : [];
  const productsById = new Map(
    products.map((product) => [String(product._id), product])
  );

  return (
    <main className={styles.pageShell}>
      <section className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Cart</h1>
          <p className={styles.subheading}>
            Review saved items and checkout when you are ready.
          </p>
        </div>

        {cartItems.length > 0 ? (
          <div className={styles.cartList}>
            {cartItems.map((item) => {
              const cartId = String(item._id);
              const product = item.productId
                ? productsById.get(item.productId)
                : null;
              const checkoutPath =
                product && item.size
                  ? `/order?${new URLSearchParams({
                      productId: String(product._id),
                      size: item.size,
                    }).toString()}`
                  : "";

              return (
                <article className={styles.cartCard} key={cartId}>
                  <div className={styles.imageWrapper}>
                    {product ? (
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
                    ) : (
                      <div className={styles.missingImage}>No image</div>
                    )}
                  </div>

                  <div className={styles.cartInfo}>
                    <div className={styles.cardHeader}>
                      <div>
                        <span className={styles.addedDate}>
                          Added {formatDate(item.createdAt)}
                        </span>
                        <h2>{product?.title || "Product unavailable"}</h2>
                      </div>
                      <span className={styles.sizeBadge}>
                        Size: {item.size || "N/A"}
                      </span>
                    </div>

                    <div className={styles.cartMeta}>
                      <span>Cart ID: {cartId}</span>
                      <span>Selected Size: {item.size || "Not selected"}</span>
                      <span>Price: {product?.price || "Not available"}</span>
                    </div>

                    <div className={styles.actions}>
                      {product ? (
                        <Link
                          className={styles.secondaryLink}
                          href={getProductPath(product)}
                        >
                          View Product
                        </Link>
                      ) : null}
                      {checkoutPath ? (
                        <Link className={styles.checkoutLink} href={checkoutPath}>
                          Checkout
                        </Link>
                      ) : null}
                      <form action={deleteCartItem}>
                        <input name="cartId" type="hidden" value={cartId} />
                        <button className={styles.deleteButton} type="submit">
                          <AiOutlineDelete aria-hidden="true" />
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>Your cart is empty.</p>
            <Link className={styles.shopLink} href="/products">
              Browse Products
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
