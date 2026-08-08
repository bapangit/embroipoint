import ProductImageSlider from "@/app/components/ProductImageSlider";
import connectDB from "@/config/DBConnect";
import Product from "@/config/models/product";
import { createProductSlug, getProductPath } from "@/lib/productUrl";
import { getBaseUrl } from "@/lib/siteUrl";
import mongoose from "mongoose";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import OrderControls from "./OrderControls";
import styles from "./page.module.css";

type ProductPageProps = {
  params: Promise<{ slug: string[] }>;
};

type ProductRecord = {
  _id: string;
  title?: string;
  price?: string;
  prevPrice?: string;
  category?: string;
  description?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  fabric?: string;
  pattern?: string;
  occasion?: string;
  fit?: string;
  neckline?: string;
  closure?: string;
  packSize?: string;
  dressesSubcategory?: string;
  sleeveStyle?: string;
  dressShape?: string;
  careInstructions?: string;
  published?: boolean;
};

type ProductImages = Pick<
  ProductRecord,
  "title" | "image1" | "image2" | "image3" | "image4" | "image5"
>;

type ProductStaticParamRecord = Pick<ProductRecord, "title"> & {
  _id: { toString(): string };
};

const getProductIdFromSlug = (slug: string[]) => slug[slug.length - 1] || "";

const getProductById = cache(async (id: string): Promise<ProductRecord | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const product = await Product.findById(id).lean<ProductRecord | null>();

  if (!product) {
    return null;
  }

  return {
    ...product,
    _id: String(product._id),
  };
});

const getProductImageUrls = (product: ProductImages) =>
  [
    product.image1,
    product.image2,
    product.image3,
    product.image4,
    product.image5,
  ].filter((imageUrl): imageUrl is string =>
    Boolean(imageUrl && imageUrl.trim() && imageUrl.startsWith("http"))
  );

const parsePrice = (value?: string) => {
  const price = Number((value || "").replace(/[^0-9.]/g, ""));

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

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
};

export async function generateStaticParams() {
  await connectDB();

  const products = await Product.find({ published: true })
    .select("_id title")
    .lean<ProductStaticParamRecord[]>();

  return products.map((product) => ({
    slug: [createProductSlug(product.title), product._id.toString()],
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = getProductIdFromSlug(slug);
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const productTitle = product?.title || "Product";
  const productDescription = product.description?.trim();
  const description =
    productDescription ||
    `Shop ${productTitle} at embroipoint.com. View price, images, and product details.`;
  const canonicalPath = getProductPath(product);
  const imageUrls = getProductImageUrls(product);
  const images = imageUrls.map((imageUrl) => ({
    url: imageUrl,
    alt: productTitle,
  }));
  const noIndex = product.published === false;

  return {
    title: productTitle,
    description: truncateText(description, 160),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: productTitle,
      description: truncateText(description, 200),
      url: canonicalPath,
      siteName: "embroipoint.com",
      images,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title: productTitle,
      description: truncateText(description, 200),
      images: imageUrls,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const id = getProductIdFromSlug(slug);
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const canonicalPath = getProductPath(product);

  if (`/product/${slug.join("/")}` !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  const productDetails = [
    { label: "Category", value: product.category },
    { label: "Material", value: product.fabric },
    { label: "Pattern", value: product.pattern },
    { label: "Occasion", value: product.occasion },
    { label: "Fit", value: product.fit },
    { label: "Neckline", value: product.neckline },
    { label: "Closure", value: product.closure },
    { label: "Pack Size", value: product.packSize },
    { label: "Dresses Subcategory", value: product.dressesSubcategory },
    { label: "Sleeve Style", value: product.sleeveStyle },
    { label: "Dress Shape", value: product.dressShape },
  ].filter((detail) => Boolean(detail.value));

  const hasProductInfo =
    productDetails.length > 0 || Boolean(product.careInstructions);
  const discountPercentage = getDiscountPercentage(
    product.prevPrice,
    product.price
  );
  const imageUrls = getProductImageUrls(product);
  const numericPrice = parsePrice(product.price);
  const productUrl = `${getBaseUrl()}${canonicalPath}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.title || "Product",
    description: product.description || undefined,
    image: imageUrls.length > 0 ? imageUrls : undefined,
    sku: product._id,
    brand: {
      "@type": "Brand",
      name: "embroipoint.com",
    },
    category: product.category || undefined,
    material: product.fabric || undefined,
    pattern: product.pattern || undefined,
    offers:
      numericPrice > 0
        ? {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "INR",
            price: numericPrice,
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: {
              "@type": "Organization",
              name: "embroipoint.com",
            },
          }
        : undefined,
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className={styles.productWrapper}>
        <div className={styles.imageWrapper}>
          <ProductImageSlider
            image1={product.image1}
            image2={product.image2}
            image3={product.image3}
            image4={product.image4}
            image5={product.image5}
            alt={product.title || "Product image"}
            height="100%"
            borderRadius="0"
            sizes="(max-width: 900px) 100vw, 48vw"
            preloadFirstImage
          />
        </div>
        <div className={styles.details}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>{product.title || "Untitled Product"}</h1>
          </div>
          <p className={styles.description}>
            {product.description || "No description available."}
          </p>
          <div className={styles.priceRow}>
            <div className={styles.priceLine}>
              <p className={styles.price}>Rs. {product.price || "0"}</p>
              {product.prevPrice ? (
                <p className={styles.prevPrice}>Rs. {product.prevPrice}</p>
              ) : null}
              {discountPercentage !== null ? (
                <span className={styles.discountText}>
                  {discountPercentage}% OFF
                </span>
              ) : null}
            </div>
            <span className={styles.taxText}>MRP inclusive of all taxes</span>
          </div>
          <OrderControls productId={product._id} productPath={canonicalPath} />
          {hasProductInfo ? (
            <section className={styles.infoSection}>
              <h2 className={styles.infoHeading}>Product Information</h2>
              <div className={styles.infoCard}>
                <h3 className={styles.infoTitle}>Product details</h3>
                {productDetails.length > 0 ? (
                  <div className={styles.infoGrid}>
                    {productDetails.map((detail) => (
                      <div key={detail.label} className={styles.infoItem}>
                        <span className={styles.infoLabel}>{detail.label}</span>
                        <span className={styles.infoValue}>{detail.value}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {product.careInstructions ? (
                  <div className={styles.careSection}>
                    <span className={styles.infoLabel}>Care Instructions</span>
                    <span className={styles.infoValue}>
                      {product.careInstructions}
                    </span>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
