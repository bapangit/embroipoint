import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Catelina's curated fashion collection and shopping experience.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | embroipoint.com",
    description:
      "Learn about Catelina's curated fashion collection and shopping experience.",
    url: "/about",
    siteName: "embroipoint.com",
    locale: "en_IN",
    type: "website",
  },
};

const values = [
  {
    title: "Curated edits",
    text: "We keep the collection focused so every visit feels easy to browse and full of wearable choices.",
  },
  {
    title: "Everyday elegance",
    text: "Our picks are selected for comfort, graceful silhouettes, and styling that moves from casual days to occasions.",
  },
  {
    title: "Simple shopping",
    text: "From product discovery to checkout, the store is built around a clear and reliable buying experience.",
  },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>About Catelina</p>
          <h1 className={styles.title}>Fashion finds selected with care.</h1>
          <p className={styles.subtitle}>
            Catelina brings together women&apos;s styles that feel polished,
            practical, and easy to love. We focus on thoughtful selections,
            clear product details, and a smoother way to shop online.
          </p>
          <Link className={styles.cta} href="/products">
            Explore products
          </Link>
        </div>

        <div className={styles.imageGrid} aria-label="Catelina fashion styles">
          <div className={styles.primaryImage}>
            <Image
              src="/category/saree.jpg"
              alt="Elegant saree from the Catelina collection"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 48vw"
            />
          </div>
          <div className={styles.secondaryImage}>
            <Image
              src="/category/kurti.jpg"
              alt="Kurti style from the Catelina collection"
              fill
              sizes="(max-width: 768px) 48vw, 22vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.story}>
        <div>
          <p className={styles.sectionLabel}>Our approach</p>
          <h2>Made for confident, repeatable shopping.</h2>
        </div>
        <p>
          We built Catelina for shoppers who want attractive options without
          endless browsing. The collection highlights versatile pieces, honest
          product presentation, and categories that help customers move quickly
          from inspiration to purchase.
        </p>
      </section>

      <section className={styles.values} aria-label="What Catelina values">
        {values.map((value) => (
          <article className={styles.valueCard} key={value.title}>
            <h2>{value.title}</h2>
            <p>{value.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
