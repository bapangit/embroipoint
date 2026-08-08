"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import styles from "./page.module.css";

type PaymentMethod = "Cash On Delivery" | "Razorpay";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions
) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

type OrderCheckoutFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  productId: string;
  productTitle: string;
  size: string;
  productPrice: number;
  deliveryFee: number;
  totalPrice: number;
  selectedAddress: {
    name?: string;
    ph?: string;
  } | null;
  orderId?: string;
};

const formatPrice = (value: number) => `Rs. ${value.toFixed(2)}`;
const formatDeliveryFee = (value: number) =>
  value === 0 ? "Free Delivery" : formatPrice(value);

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function OrderCheckoutForm({
  action,
  children,
  productId,
  productTitle,
  size,
  productPrice,
  deliveryFee,
  totalPrice,
  selectedAddress,
  orderId,
}: OrderCheckoutFormProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("Cash On Delivery");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isOrderComplete = Boolean(orderId);
  const canSubmit = Boolean(selectedAddress) && !isOrderComplete && !isProcessing;

  async function startRazorpayPayment() {
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const createResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, size }),
      });
      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.success) {
        throw new Error(createData.message || "Could not start payment.");
      }

      const checkout = new window.Razorpay({
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency,
        name: "Ecom App",
        description: productTitle,
        order_id: createData.razorpayOrderId,
        prefill: {
          name: selectedAddress?.name,
          contact: selectedAddress?.ph,
        },
        theme: {
          color: "#111827",
        },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                productId,
                size,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData.message || "Payment verification failed."
              );
            }

            router.push(
              `/order?${new URLSearchParams({
                productId,
                size,
                orderId: verifyData.orderId,
              }).toString()}`
            );
            router.refresh();
          } catch (error) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Payment verification failed."
            );
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      });

      checkout.open();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not start payment."
      );
      setIsProcessing(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (paymentMethod !== "Razorpay") {
      return;
    }

    event.preventDefault();

    if (!selectedAddress || isOrderComplete || isProcessing) {
      return;
    }

    void startRazorpayPayment();
  }

  return (
    <form action={action} className={styles.summaryGrid} onSubmit={handleSubmit}>
      <input name="productId" type="hidden" value={productId} />
      <input name="size" type="hidden" value={size} />
      {children}

      <aside className={styles.pricePanel}>
        <section className={styles.paymentPanel}>
          <h2>Payment Method</h2>
          <div className={styles.paymentOptions}>
            <label className={styles.paymentOption}>
              <input
                type="radio"
                name="paymentMethod"
                value="Cash On Delivery"
                checked={paymentMethod === "Cash On Delivery"}
                onChange={() => setPaymentMethod("Cash On Delivery")}
              />
              <span>Cash On Delivery</span>
            </label>
            <label className={styles.paymentOption}>
              <input
                type="radio"
                name="paymentMethod"
                value="Razorpay"
                checked={paymentMethod === "Razorpay"}
                onChange={() => setPaymentMethod("Razorpay")}
              />
              <span>Razorpay (UPI / Cards)</span>
            </label>
          </div>
          {errorMessage ? (
            <p className={styles.paymentError}>{errorMessage}</p>
          ) : null}
        </section>

        <h2>Price Details</h2>
        <div className={styles.priceLine}>
          <span>Product Price</span>
          <span>{formatPrice(productPrice)}</span>
        </div>
        <div className={styles.priceLine}>
          <span>Delivery Fee</span>
          <span>{formatDeliveryFee(deliveryFee)}</span>
        </div>
        <div className={styles.totalLine}>
          <span>Total</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <button className={styles.confirmButton} disabled={!canSubmit} type="submit">
          {isOrderComplete
            ? "Order Confirmed"
            : isProcessing
              ? "Processing..."
              : paymentMethod === "Razorpay"
                ? "Pay with Razorpay"
                : "Confirm Order"}
        </button>
      </aside>
    </form>
  );
}
