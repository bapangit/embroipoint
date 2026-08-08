"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoCloseOutline, IoSearchOutline } from "react-icons/io5";
import { getProductPath } from "@/lib/productUrl";

const SearchComponent = ({ styles }) => {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const toggleSearchPanel = () => setShow((prev) => !prev);
  const closeSearchPanel = () => setShow(false);
  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      inputRef.current?.focus();
      return;
    }

    closeSearchPanel();
    router.push(`/products?search=${encodeURIComponent(trimmedQuery)}`);
  };

  const searchText = query.trim().toLowerCase();
  const suggestions = products
    .filter((product) => {
      if (!searchText) return true;

      return [product.title, product.category, product.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchText));
    })
    .slice(0, 6);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShow(false);
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;

    inputRef.current?.focus();
  }, [show]);

  useEffect(() => {
    if (!show || products.length > 0) return;

    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products/published?page=1&limit=30", {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data?.message || "Unable to load suggestions");
        }

        setProducts(data.products || []);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Search suggestions fetch error:", err);
        setError("Could not load suggestions");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [show, products.length]);

  return (
    <div ref={wrapperRef}>
      <span className={styles.search} onClick={toggleSearchPanel}>
        {show ? (
          <IoCloseOutline className="icon" />
        ) : (
          <IoSearchOutline className="icon" />
        )}
      </span>

      {show && (
        <div className={styles.search_panel}>
          <form className={styles.search_form} onSubmit={handleSearchSubmit}>
            <input
              ref={inputRef}
              type="search"
              value={query}
              placeholder="Search products"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className={styles.search_suggestions}>
            {loading && (
              <p className={styles.search_status}>Loading suggestions...</p>
            )}

            {error && <p className={styles.search_status}>{error}</p>}

            {!loading &&
              !error &&
              suggestions.map((product) => (
                <Link
                  key={product._id}
                  href={getProductPath(product)}
                  className={styles.search_suggestion}
                  onClick={closeSearchPanel}
                >
                  <span
                    className={styles.search_suggestion_image}
                    style={
                      product.image1
                        ? { backgroundImage: `url(${product.image1})` }
                        : undefined
                    }
                    aria-hidden="true"
                  />
                  <span className={styles.search_suggestion_text}>
                    <strong>{product.title || "Untitled Product"}</strong>
                    <small>
                      {product.category || "Product"}
                      {product.price ? ` - INR ${product.price}` : ""}
                    </small>
                  </span>
                </Link>
              ))}

            {!loading && !error && suggestions.length === 0 && (
              <p className={styles.search_status}>No matching products found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
