import connectDB from "@/config/DBConnect";
import Address from "@/config/models/address";
import Order from "@/config/models/orders";
import Product from "@/config/models/product";
import User from "@/config/models/user";
import { getProductPath } from "@/lib/productUrl";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import styles from "./page.module.css";

type AddressRecord = {
  _id?: mongoose.Types.ObjectId | string;
  name?: string;
  ph?: string;
  pin?: string;
  at?: string;
  po?: string;
  dist?: string;
  state?: string;
};

type OrderRecord = {
  _id: mongoose.Types.ObjectId | string;
  user?: string;
  productId?: string;
  addressId?: string;
  address?: AddressRecord;
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
};

type UserRecord = {
  _id: mongoose.Types.ObjectId | string;
  name?: string;
  email?: string;
  selectedAddress?: string;
};

type AdminOrdersPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const orderStatuses = ["placed", "confirmed", "shipped", "delivered", "cancelled"];

async function getAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.role !== "admin") {
    return null;
  }

  return session;
}

function readRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
    hour: "numeric",
    minute: "2-digit",
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

function getStatusFilter(status?: string) {
  return status && orderStatuses.includes(status) ? status : "";
}

function uniqueValidIds(values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          typeof value === "string" && mongoose.Types.ObjectId.isValid(value)
      )
    )
  );
}

function getOrderAddress(
  order: OrderRecord,
  user: UserRecord | undefined,
  addressesById: Map<string, AddressRecord>
) {
  if (order.address) {
    return order.address;
  }

  if (order.addressId) {
    const orderAddress = addressesById.get(order.addressId);

    if (orderAddress) {
      return orderAddress;
    }
  }

  const selectedAddressId = user?.selectedAddress
    ? String(user.selectedAddress)
    : "";

  return selectedAddressId ? addressesById.get(selectedAddressId) : undefined;
}

async function updateOrderStatus(formData: FormData) {
  "use server";

  const session = await getAdminSession();
  const orderId = readRequiredField(formData, "orderId");
  const status = readRequiredField(formData, "status");

  if (!session) {
    throw new Error("Only admins can update orders.");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order.");
  }

  if (!orderStatuses.includes(status)) {
    throw new Error("Invalid order status.");
  }

  await connectDB();
  await Order.findByIdAndUpdate(orderId, { status });

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const session = await getAdminSession();
  const { status } = await searchParams;
  const activeStatus = getStatusFilter(status);

  if (!session) {
    return (
      <main className={styles.pageShell}>
        <section className={styles.container}>
          <h1 className={styles.heading}>Admin Orders</h1>
          <p className={styles.emptyText}>Access denied.</p>
        </section>
      </main>
    );
  }

  await connectDB();

  const orderQuery =
    activeStatus === "placed"
      ? { $or: [{ status: activeStatus }, { status: { $exists: false } }] }
      : activeStatus
        ? { status: activeStatus }
        : {};
  const orders = await Order.find(orderQuery)
    .sort({ createdAt: -1 })
    .lean<OrderRecord[]>();
  const productIds = uniqueValidIds(orders.map((order) => order.productId));
  const userIds = uniqueValidIds(orders.map((order) => order.user));
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).lean<ProductRecord[]>()
    : [];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } }).lean<UserRecord[]>()
    : [];
  const usersById = new Map(users.map((user) => [String(user._id), user]));
  const fallbackAddressIds = users
    .map((user) => (user.selectedAddress ? String(user.selectedAddress) : ""))
    .filter(Boolean);
  const addressIds = uniqueValidIds([
    ...orders.map((order) => order.addressId),
    ...fallbackAddressIds,
  ]);
  const addresses = addressIds.length
    ? await Address.find({ _id: { $in: addressIds } }).lean<AddressRecord[]>()
    : [];
  const productsById = new Map(
    products.map((product) => [String(product._id), product])
  );
  const addressesById = new Map(
    addresses.map((address) => [String(address._id), address])
  );

  return (
    <main className={styles.pageShell}>
      <section className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Admin Orders</h1>
          <p className={styles.subheading}>
            View every order with customer, product, delivery address, and status.
          </p>
        </div>

        <form action="/admin/orders" className={styles.filterForm} method="get">
          <label>
            <span>Filter by status</span>
            <select name="status" defaultValue={activeStatus || "all"}>
              <option value="all">All Orders</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Apply Filter</button>
          {activeStatus ? (
            <Link className={styles.clearFilterLink} href="/admin/orders">
              Clear
            </Link>
          ) : null}
        </form>

        {orders.length > 0 ? (
          <div className={styles.orderList}>
            {orders.map((order) => {
              const orderId = String(order._id);
              const product = order.productId
                ? productsById.get(order.productId)
                : undefined;
              const user = order.user ? usersById.get(order.user) : undefined;
              const address = getOrderAddress(order, user, addressesById);

              return (
                <article className={styles.orderCard} key={orderId}>
                  <div className={styles.orderHeader}>
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

                  <div className={styles.detailsGrid}>
                    <section className={styles.detailSection}>
                      <h3>Order</h3>
                      <p>ID: {orderId}</p>
                      <p>Size: {order.size || "Not selected"}</p>
                      <p>Payment: {order.paymentMethod || "Not available"}</p>
                      {order.razorpayPaymentId ? (
                        <p>Razorpay Payment ID: {order.razorpayPaymentId}</p>
                      ) : null}
                      <p>
                        Amount: {order.amount || product?.price || "Not available"}
                      </p>
                      {product ? (
                        <Link
                          className={styles.productLink}
                          href={getProductPath(product)}
                        >
                          View Product
                        </Link>
                      ) : null}
                    </section>

                    <section className={styles.detailSection}>
                      <h3>Customer</h3>
                      <p>{user?.name || "Customer unavailable"}</p>
                      <p>{user?.email || "Email unavailable"}</p>
                    </section>

                    <section className={styles.detailSection}>
                      <h3>Delivery Address</h3>
                      {address ? (
                        <>
                          <p>{address.name || "Unnamed address"}</p>
                          <p>{address.at || "Address unavailable"}</p>
                          <p>
                            {[address.po, address.dist]
                              .filter(Boolean)
                              .join(", ") || "Area unavailable"}
                          </p>
                          <p>
                            {[address.state, address.pin]
                              .filter(Boolean)
                              .join(" - ") || "PIN unavailable"}
                          </p>
                          <p>Phone: {address.ph || "Unavailable"}</p>
                        </>
                      ) : (
                        <p>Address unavailable</p>
                      )}
                    </section>
                  </div>

                  <form action={updateOrderStatus} className={styles.statusForm}>
                    <input name="orderId" type="hidden" value={orderId} />
                    <label>
                      <span>Status</span>
                      <select name="status" defaultValue={order.status || "placed"}>
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit">Update Status</button>
                  </form>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              {activeStatus
                ? `No ${formatStatus(activeStatus).toLowerCase()} orders found.`
                : "No orders found."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
