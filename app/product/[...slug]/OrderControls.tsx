"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCart } from "./actions";
import styles from "./page.module.css";

type OrderControlsProps = {
  productId: string;
  productPath: string;
};

const sizes = ["S", "M", "L", "XL", "XXL"];

export default function OrderControls({ productId, productPath }: OrderControlsProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedSize, setSelectedSize] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [isAddingToCart, startAddToCartTransition] = useTransition();

  const openOrderPage = () => {
    if (!selectedSize) {
      return;
    }

    if (!session) {
      const params = new URLSearchParams({
        productId,
        size: selectedSize,
      });

      signIn("google", {
        callbackUrl: `/order?${params.toString()}`,
      });
      return;
    }

    const params = new URLSearchParams({
      productId,
      size: selectedSize,
    });

    router.push(`/order?${params.toString()}`);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      return;
    }

    setCartMessage("");

    if (!session) {
      signIn("google", {
        callbackUrl: productPath,
      });
      return;
    }

    startAddToCartTransition(async () => {
      const result = await addToCart(productId, selectedSize);
      setCartMessage(result.message);
    });
  };

  return (
    <div className={styles.optionSection}>
      <div className={styles.optionTitle}>Select Size</div>
      <div className={styles.sizeButtons}>
        {sizes.map((size) => (
          <button
            aria-pressed={selectedSize === size}
            className={`${styles.sizeButton} ${
              selectedSize === size ? styles.selectedSizeButton : ""
            }`}
            key={size}
            onClick={() => setSelectedSize(size)}
            type="button"
          >
            {size}
          </button>
        ))}
      </div>
      <div className={styles.actionButtons}>
        <button
          className={styles.cartButton}
          disabled={!selectedSize || status === "loading" || isAddingToCart}
          onClick={handleAddToCart}
          type="button"
        >
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </button>
        <button
          className={styles.orderButton}
          disabled={!selectedSize || status === "loading"}
          onClick={openOrderPage}
          type="button"
        >
          Place Order
        </button>
      </div>
      {cartMessage ? (
        <p className={styles.cartMessage} role="status">
          {cartMessage}
        </p>
      ) : null}
    </div>
  );
}
