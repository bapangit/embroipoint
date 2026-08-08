"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import ProductImageSlider from "../components/ProductImageSlider";
import { getProductPath } from "@/lib/productUrl";
import styles from "./page.module.css";

type Product = {
  _id: string;
  title?: string;
  description?: string;
  price?: string;
  prevPrice?: string;
  category?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  orderFrequency?: number;
};

const PAGE_SIZE = 12;

const parsePrice = (value?: string) => {
  if (!value) {
    return 0;
  }

  const price = Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(price) ? price : 0;
};

const getDiscountPercentage = (prevPrice?: string, price?: string) => {
  const previous = parsePrice(prevPrice);
  const current = parsePrice(price);

  if (!previous || !current || current >= previous) {
    return null;
  }

  return Math.round(((previous - current) / previous) * 100);
};

export default function MostOrderedClient() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const observer = useRef<IntersectionObserver | null>(null);
  const isAdmin = session?.user?.role === "admin";

  const loadProducts = useCallback(async (pageNumber: number) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: String(PAGE_SIZE),
      });

      const response = await fetch(
        `/api/products/most-ordered?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Unable to load products");
      }

      setProducts((currentProducts) =>
        pageNumber === 1
          ? data.products
          : [...currentProducts, ...data.products]
      );
      setHasMore(Boolean(data.hasMore));
      setError("");
    } catch (err) {
      console.error("Most ordered products fetch error:", err);
      setError("Could not load most ordered products. Please try again later.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(1);
  }, [loadProducts]);

  useEffect(() => {
    if (page === 1) {
      return;
    }

    loadProducts(page);
  }, [loadProducts, page]);

  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) {
        return;
      }

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((currentPage) => currentPage + 1);
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [hasMore, loading, loadingMore]
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p>Customer favorites</p>
        <h1>Most ordered products</h1>
      </header>

      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.productsGrid}>
        {products.map((product, index) => {
          const discountPercentage = getDiscountPercentage(
            product.prevPrice,
            product.price
          );
          const isLastItem = index === products.length - 1;

          return (
            <article
              className={styles.productCard}
              key={product._id}
              ref={isLastItem ? lastProductRef : null}
            >
              <Link
                className={styles.productLink}
                href={getProductPath(product)}
              >
                <div className={styles.imageWrap}>
                  <ProductImageSlider
                    image1={product.image1}
                    image2={product.image2}
                    image3={product.image3}
                    image4={product.image4}
                    image5={product.image5}
                    alt={product.title || "Product image"}
                    height="auto"
                    aspectRatio="3 / 4"
                    borderRadius="0"
                    sizes="(max-width: 640px) 50vw, (max-width: 1200px) 25vw, 220px"
                  />
                  {isAdmin ? (
                    <span className={styles.orderBadge}>
                      {product.orderFrequency || 0} orders
                    </span>
                  ) : null}
                </div>

                <div className={styles.productDetails}>
                  <p className={styles.category}>
                    {product.category || "Product"}
                  </p>
                  <h2>{product.title || "Untitled Product"}</h2>
                  <p className={styles.description}>
                    {product.description || "No description available."}
                  </p>
                  <div className={styles.priceRow}>
                    <span>Rs. {product.price || "0"}</span>
                    {product.prevPrice ? <del>Rs. {product.prevPrice}</del> : null}
                    {discountPercentage !== null ? (
                      <strong>{discountPercentage}% OFF</strong>
                    ) : null}
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {loading ? (
        <p className={styles.statusText}>Loading products...</p>
      ) : null}
      {loadingMore ? (
        <p className={styles.statusText}>Loading more products...</p>
      ) : null}
      {!loading && products.length === 0 ? (
        <p className={styles.statusText}>No published products found.</p>
      ) : null}
      {!hasMore && products.length > 0 ? (
        <p className={styles.endText}>You have reached the end of the list.</p>
      ) : null}
    </section>
  );
}
