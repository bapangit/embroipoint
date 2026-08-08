import Order from "@/config/models/orders";
import Product from "@/config/models/product";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  formatPrice,
  getCheckoutContext,
  getSavedOrderIds,
} from "../helpers";

type VerifyRequestBody = {
  productId?: unknown;
  size?: unknown;
  razorpayOrderId?: unknown;
  razorpayPaymentId?: unknown;
  razorpaySignature?: unknown;
};

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function verifySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(razorpaySignature);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

async function getRazorpayOrder(razorpayOrderId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  const authToken = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(
    `https://api.razorpay.com/v1/orders/${razorpayOrderId}`,
    {
      headers: {
        Authorization: `Basic ${authToken}`,
      },
    }
  );
  const order = (await response.json()) as {
    amount?: number;
    currency?: string;
    notes?: {
      productId?: string;
      size?: string;
    };
    error?: {
      description?: string;
    };
  };

  if (!response.ok) {
    throw new Error(
      order.error?.description || "Could not verify Razorpay order."
    );
  }

  return order;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyRequestBody;
    const {
      productId,
      size,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (
      !isString(productId) ||
      !isString(size) ||
      !isString(razorpayOrderId) ||
      !isString(razorpayPaymentId) ||
      !isString(razorpaySignature)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid payment verification request." },
        { status: 400 }
      );
    }

    if (
      !verifySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Payment signature is invalid." },
        { status: 400 }
      );
    }

    const { user, product, selectedAddress, totalAmount } =
      await getCheckoutContext(productId, size);
    const existingOrder = await Order.findOne({ razorpayPaymentId });

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        orderId: String(existingOrder._id),
      });
    }

    const razorpayOrder = await getRazorpayOrder(razorpayOrderId);
    const expectedAmount = Math.round(totalAmount * 100);

    if (
      razorpayOrder.amount !== expectedAmount ||
      razorpayOrder.currency !== "INR" ||
      razorpayOrder.notes?.productId !== productId ||
      razorpayOrder.notes?.size !== size
    ) {
      return NextResponse.json(
        { success: false, message: "Payment does not match this order." },
        { status: 400 }
      );
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
      amount: formatPrice(totalAmount),
      paymentMethod: "Razorpay",
      paymentStatus: "paid",
      razorpayOrderId,
      razorpayPaymentId,
    });

    await Product.updateOne(
      { _id: product._id },
      { $inc: { orderFrequency: 1 } }
    );

    user.orderIds = [...getSavedOrderIds(user), String(order._id)];
    await user.save();

    revalidatePath("/order");
    revalidatePath("/orders");
    revalidatePath("/admin/orders");

    return NextResponse.json({
      success: true,
      orderId: String(order._id),
    });
  } catch (error) {
    console.error("Razorpay verification API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}
