import ProductImageSlider from "@/app/components/ProductImageSlider";
import connectDB from "@/config/DBConnect";
import Order from "@/config/models/orders";
import Product from "@/config/models/product";
import User from "@/config/models/user";
import { getProductPath } from "@/lib/productUrl";
import mongoose from "mongoose";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "../api/auth/[...nextauth]/route";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Orders",
  robots: {
    index: false,
    follow: false,
  },
};

type OrderRecord = {
  _id: mongoose.Types.ObjectId | string;
  productId?: string;
  size?: string;
  amount?: string;
  paymentMethod?: string;
  razorpayPaymentId?: string;
  status?: string;
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

function formatStatus(value?: string) {
  if (!value) {
    return "Placed";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className={styles.pageShell}>
        <section className={styles.container}>
          <h1 className={styles.heading}>Orders</h1>
          <p className={styles.emptyText}>Please sign in to view your orders.</p>
        </section>
      </main>
    );
  }

  const orders = await Order.find({ user: String(user._id) })
    .sort({ createdAt: -1 })
    .lean<OrderRecord[]>();
  const productIds = Array.from(
    new Set(
      orders
        .map((order) => order.productId)
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
          <h1 className={styles.heading}>Order History</h1>
          <p className={styles.subheading}>
            Review your previous purchases and current order status.
          </p>
        </div>

        {orders.length > 0 ? (
          <div className={styles.orderList}>
            {orders.map((order) => {
              const orderId = String(order._id);
              const product = order.productId
                ? productsById.get(order.productId)
                : null;

              return (
                <article className={styles.orderCard} key={orderId}>
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

                  <div className={styles.orderInfo}>
                    <div className={styles.cardHeader}>
                      <div>
                        <span className={styles.orderDate}>
                          {formatDate(order.createdAt)}
                        </span>
                        <h2>{product?.title || "Product unavailable"}</h2>
                      </div>
                      <span className={styles.statusBadge}>
                        {formatStatus(order.status)}
                      </span>
                    </div>

                    <div className={styles.orderMeta}>
                      <span>Order ID: {orderId}</span>
                      <span>Size: {order.size || "Not selected"}</span>
                      <span>
                        Payment: {order.paymentMethod || "Not available"}
                      </span>
                      {order.razorpayPaymentId ? (
                        <span>Payment ID: {order.razorpayPaymentId}</span>
                      ) : null}
                      <span>
                        Amount: {order.amount || product?.price || "Not available"}
                      </span>
                    </div>

                    {product ? (
                      <Link
                        className={styles.productLink}
                        href={getProductPath(product)}
                      >
                        View Product
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>You have not placed any orders yet.</p>
            <Link className={styles.shopLink} href="/products">
              Browse Products
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
