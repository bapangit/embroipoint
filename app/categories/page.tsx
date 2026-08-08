import Link from "next/link";
import type { Metadata } from "next";
import { dressCategories } from "@/config/productInfoOpt";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Shop Catelina fashion by category, from sarees and kurtis to festive sets and flowing dresses.",
  alternates: {
    canonical: "/categories",
  },
  openGraph: {
    title: "Categories | embroipoint.com",
    description:
      "Shop Catelina fashion by category, from sarees and kurtis to festive sets and flowing dresses.",
    url: "/categories",
    siteName: "embroipoint.com",
    locale: "en_IN",
    type: "website",
  },
};

export default function CategoriesPage() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Browse by Style</p>
        <h1 className={styles.title}>Indianwear for Every Moment</h1>
        <p className={styles.subtitle}>
          Find graceful sarees, easy kurtis, festive sets, and flowing dresses
          curated for everyday plans and special celebrations.
        </p>
      </div>

      <div className={styles.grid}>
        {dressCategories.map((category) => (
          <Link
            key={category.name}
            href={`/products?category=${encodeURIComponent(category.name)}`}
            className={styles.card}
          >
            <div
              className={styles.image}
              style={{ backgroundImage: `url(${category.image})` }}
              aria-hidden="true"
            />
            <div className={styles.content}>
              <h2 className={styles.cardTitle}>{category.name}</h2>
              <p className={styles.cardText}>{category.description}</p>
              <span className={styles.link}>
                Shop now
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
