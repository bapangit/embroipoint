import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import AdminOrderBadge from "./components/AdminOrderBadge";
import ProductImageSlider from "./components/ProductImageSlider";
import connectDB from "@/config/DBConnect";
import Product from "@/config/models/product";
import { getProductPath } from "@/lib/productUrl";
import styles from "./Page.module.css";



export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

type FrequencyProduct = {
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

async function getProductsByOrderFrequency(): Promise<FrequencyProduct[]> {
  await connectDB();

  const products = await Product.find({ published: true })
    .sort({ orderFrequency: -1, _id: -1 })
    .limit(40)
    .lean<FrequencyProduct[]>();

  return products.map((product) => ({
    ...product,
    _id: String(product._id),
  }));
}

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

export default async function Home() {
  const frequentProducts = await getProductsByOrderFrequency();

  return (
    <>
      <section className={styles.hero_section}>
        <div className={styles.hero_content}>
          <div className={styles.hero_copy}>
            <p className={styles.hero_eyebrow}>New season edit</p>
            <h1 className={styles.hero_title}>Bring Your Ideas to Life with Embroidery</h1>
            <p className={styles.hero_text}>
              Discover beautiful embroidery designs, patterns, and inspiration for every stitch.
            </p>
            <Link className={styles.hero_cta} href="/products">
              Shop collection
            </Link>
          </div>
          <div className={styles.hero_image_wrap}>
            <Image
              className={styles.hero_image}
              src="/hero.png"
              alt="Woman wearing a beautiful maxi dress"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 48vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.frequency_section}>
        <div className={styles.frequency_header}>
          <div>
            <p className={styles.frequency_eyebrow}>Customer favorites</p>
            <h2 className={styles.frequency_title}>Most ordered products</h2>
          </div>
          <Link className={styles.frequency_link} href="/products">
            View all
          </Link>
        </div>

        {frequentProducts.length > 0 ? (
          <div className={styles.frequency_grid}>
            {frequentProducts.map((product) => {
              const discountPercentage = getDiscountPercentage(
                product.prevPrice,
                product.price
              );

              return (
                <article className={styles.frequency_card} key={product._id}>
                  <Link
                    className={styles.frequency_product_link}
                    href={getProductPath(product)}
                  >
                    <div className={styles.frequency_image}>
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
                      <AdminOrderBadge
                        className={styles.frequency_badge}
                        count={product.orderFrequency}
                      />
                    </div>
                    <div className={styles.frequency_details}>
                      <p className={styles.frequency_category}>
                        {product.category || "Product"}
                      </p>
                      <h3>{product.title || "Untitled Product"}</h3>
                      <p className={styles.frequency_description}>
                        {product.description || "No description available."}
                      </p>
                      <div className={styles.frequency_price_row}>
                        <span>Rs. {product.price || "0"}</span>
                        {product.prevPrice ? (
                          <del>Rs. {product.prevPrice}</del>
                        ) : null}
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
        ) : (
          <p className={styles.frequency_empty}>No published products found.</p>
        )}
      </section>
    </>
  );
}
