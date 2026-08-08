import { NextResponse } from "next/server";
import { getCheckoutContext } from "../helpers";

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return { keyId, keySecret };
}

export async function POST(request: Request) {
  try {
    const { productId, size } = await request.json();

    if (typeof productId !== "string" || typeof size !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid checkout request." },
        { status: 400 }
      );
    }

    const { keyId, keySecret } = getRazorpayCredentials();
    const { product, totalAmount } = await getCheckoutContext(productId, size);
    const amount = Math.round(totalAmount * 100);
    const authToken = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `order_${Date.now()}`,
        notes: {
          productId,
          size,
        },
      }),
    });
    const razorpayOrder =
      (await razorpayResponse.json()) as Partial<RazorpayOrderResponse> & {
        error?: { description?: string };
      };

    if (!razorpayResponse.ok || !razorpayOrder.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            razorpayOrder.error?.description ||
            "Could not create Razorpay order.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      keyId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      productTitle: product.title || "Product",
    });
  } catch (error) {
    console.error("Razorpay order API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Could not start payment.",
      },
      { status: 500 }
    );
  }
}
