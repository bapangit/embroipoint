import connectDB from "@/config/DBConnect";
import Product from "@/config/models/product";
import { getProductPath } from "@/lib/productUrl";
import { getBaseUrl } from "@/lib/siteUrl";
import type { MetadataRoute } from "next";

type ProductSitemapRecord = {
  _id: string | { toString(): string };
  title?: string;
  updatedAt?: Date | string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
};

export const revalidate = 3600;

const getProductImageUrls = (product: ProductSitemapRecord) =>
  [
    product.image1,
    product.image2,
    product.image3,
    product.image4,
    product.image5,
  ].filter((imageUrl): imageUrl is string =>
    Boolean(imageUrl && imageUrl.trim() && imageUrl.startsWith("http"))
  );

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/most-ordered`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  await connectDB();

  const products = await Product.find({ published: true })
    .select("_id title updatedAt image1 image2 image3 image4 image5")
    .sort({ updatedAt: -1 })
    .lean<ProductSitemapRecord[]>();

  return [
    ...routes,
    ...products.map((product) => ({
      url: `${baseUrl}${getProductPath(product)}`,
      lastModified: product.updatedAt || now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: getProductImageUrls(product),
    })),
  ];
}
