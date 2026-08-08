"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoCloseOutline, IoFilterOutline } from "react-icons/io5";
import { MdModeEditOutline } from "react-icons/md";
import ProductImageSlider from "../components/ProductImageSlider";
import { dressCategories } from "@/config/productInfoOpt";
import { getProductPath } from "@/lib/productUrl";
import styles from "./page.module.css";

interface Product {
  _id: string;
  title: string;
  description:string;
  price: string;
  prevPrice: string;
  category: string;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
  image5: string;
}

const PAGE_SIZE = 8;

type ProductsClientProps = {
  initialProducts: Product[];
  initialHasMore: boolean;
  initialCategory: string;
  initialSearchText: string;
};

const parsePrice = (value: string) => {
  const price = Number(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(price) ? price : 0;
};

const getDiscountPercentage = (prevPrice: string, price: string) => {
  const previous = parsePrice(prevPrice);
  const current = parsePrice(price);

  if (!previous || !current || current >= previous) {
    return null;
  }

  return Math.round(((previous - current) / previous) * 100);
};

const ProductsClient = ({
  initialProducts,
  initialHasMore,
  initialCategory,
  initialSearchText,
}: ProductsClientProps) => {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [searchText, setSearchText] = useState(initialSearchText);
  const [debouncedSearchText, setDebouncedSearchText] = useState(initialSearchText);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFilterButtonHidden, setIsFilterButtonHidden] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastScrollY = useRef(0);
  const initialLoadHandled = useRef(false);
  const isAdmin = session?.user?.role === "admin";

  const loadProducts = useCallback(async (
    pageNumber: number,
    categoryFilter: string,
    searchFilter: string
  ) => {
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

      if (categoryFilter) {
        params.set("category", categoryFilter);
      }

      if (searchFilter.trim()) {
        params.set("search", searchFilter.trim());
      }

      const response = await fetch(
        `/api/products/published?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || "Unable to load products");
      }

      setProducts((prev) =>
        pageNumber === 1 ? data.products : [...prev, ...data.products]
      );
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error("Published products fetch error:", err);
      setError("Could not load products. Please try again later.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchText]);

  useEffect(() => {
    if (!initialLoadHandled.current) {
      initialLoadHandled.current = true;
      setProducts(initialProducts);
      setHasMore(initialHasMore);
      setLoading(false);
      return;
    }

    setPage(1);
    loadProducts(1, category, debouncedSearchText);
  }, [category, debouncedSearchText, initialHasMore, initialProducts, loadProducts]);

  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) {
        observer.current.disconnect();
      }
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore]
  );

  useEffect(() => {
    if (page === 1) return;
    loadProducts(page, category, debouncedSearchText);
  }, [category, debouncedSearchText, loadProducts, page]);

  useEffect(() => {
    if (!isFilterModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isFilterModalOpen]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current + 8;
      const isScrollingUp = currentScrollY < lastScrollY.current - 8;

      if (currentScrollY < 24 || isScrollingUp) {
        setIsFilterButtonHidden(false);
      } else if (isScrollingDown) {
        setIsFilterButtonHidden(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const renderFilters = (idPrefix: string) => (
    <>
      <div className={styles.filterGroup}>
        <label htmlFor={`${idPrefix}-product-search`}>Search</label>
        <input
          id={`${idPrefix}-product-search`}
          type="search"
          value={searchText}
          placeholder="Search products"
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor={`${idPrefix}-category-filter`}>Category</label>
        <select
          id={`${idPrefix}-category-filter`}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">All categories</option>
          {dressCategories.map((option) => (
            <option key={option.name} value={option.name}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  return (
    <div className={styles.productsPage}>
      <aside className={styles.filterSection}>
        <h2>Filters</h2>
        {renderFilters("desktop")}
      </aside>

      <section className={styles.productsContent}>
        <button
          type="button"
          className={`${styles.mobileFilterButton} ${
            isFilterButtonHidden ? styles.mobileFilterButtonHidden : ""
          }`}
          onClick={() => setIsFilterModalOpen(true)}
        >
          <IoFilterOutline aria-hidden="true" />
          <span>Filters</span>
        </button>

        {isFilterModalOpen && (
          <div
            className={styles.filterModalOverlay}
            role="presentation"
            onClick={() => setIsFilterModalOpen(false)}
          >
            <div
              className={styles.filterModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-filters-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.filterModalHeader}>
                <h2 id="mobile-filters-title">Filters</h2>
                <button
                  type="button"
                  className={styles.filterModalClose}
                  aria-label="Close filters"
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  <IoCloseOutline aria-hidden="true" />
                </button>
              </div>

              <div className={styles.filterModalBody}>
                {renderFilters("mobile")}
              </div>

              <button
                type="button"
                className={styles.filterApplyButton}
                onClick={() => setIsFilterModalOpen(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.productsGrid}>
          {products.map((product, index) => {
            const isLastItem = index === products.length - 1;
            const discountPercentage = getDiscountPercentage(
              product.prevPrice,
              product.price
            );
            const productPath = getProductPath(product);

            return (
              <div
                key={product._id}
                ref={isLastItem ? lastProductRef : null}
                className={styles.productCard}
              >
                <div className={styles.imageWrap}>
                  <Link
                    href={productPath}
                    className={styles.imageLink}
                    aria-label={`View ${product.title || "product"}`}
                  >
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
                  </Link>
                  {isAdmin && (
                    <Link
                      href={`/admin/addproduct?id=${product._id}`}
                      className={styles.editImageButton}
                      aria-label={`Edit ${product.title || "product"}`}
                      title="Edit product"
                    >
                      <MdModeEditOutline aria-hidden="true" />
                    </Link>
                  )}
                </div>

                <Link href={productPath} className={styles.productLink}>
                  <div className={styles.productDetails}>
                    <h3 className={styles.productBrand}>
                      {product.title || "Product"}
                    </h3>
                    <p className={styles.productTitle}>
                      {product.description || "Untitled Product"}
                    </p>
                    <div className={styles.priceRow}>
                      <p>Rs. {product.price || "0"}</p>
                      {product.prevPrice && (
                        <span className={styles.prevPrice}>
                          Rs. {product.prevPrice}
                        </span>
                      )}
                      {discountPercentage !== null && (
                        <span className={styles.discountText}>
                          ({discountPercentage}% OFF)
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {loading && <h2 className={styles.statusText}>Loading products...</h2>}
        {loadingMore && (
          <p className={styles.statusText}>Loading more products...</p>
        )}
        {!loading && products.length === 0 && (
          <p className={styles.statusText}>No published products found.</p>
        )}
        {!hasMore && products.length > 0 && (
          <p className={styles.endText}>
            You have reached the end of the products list.
          </p>
        )}
      </section>
    </div>
  );
};

export default ProductsClient;
