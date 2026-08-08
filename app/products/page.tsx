import { Suspense } from "react";
import type { Metadata } from "next";
import connectDB from "@/config/DBConnect";
import Product from "@/config/models/product";
import ProductsClient from "./ProductsClient";

const PAGE_SIZE = 8;

type ProductListRecord = {
  _id: string | { toString(): string };
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
};

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    search?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse Catelina's curated fashion collection, including sarees, kurtis, dresses, and everyday styles.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Products | embroipoint.com",
    description:
      "Browse Catelina's curated fashion collection, including sarees, kurtis, dresses, and everyday styles.",
    url: "/products",
    siteName: "embroipoint.com",
    locale: "en_IN",
    type: "website",
  },
};

const getSingleSearchParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] || "" : value || "";

const getInitialProducts = async (category: string, search: string) => {
  await connectDB();

  const filter: {
    published: boolean;
    category?: string;
    $or?: Array<Record<string, RegExp>>;
  } = { published: true };

  if (category) {
    filter.category = category;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");

    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
    ];
  }

  const products = await Product.find(filter)
    .select("_id title description price prevPrice category image1 image2 image3 image4 image5")
    .sort({ _id: -1 })
    .limit(PAGE_SIZE)
    .lean<ProductListRecord[]>();

  return products.map((product) => ({
    ...product,
    _id: String(product._id),
    title: product.title || "",
    description: product.description || "",
    price: product.price || "",
    prevPrice: product.prevPrice || "",
    category: product.category || "",
    image1: product.image1 || "",
    image2: product.image2 || "",
    image3: product.image3 || "",
    image4: product.image4 || "",
    image5: product.image5 || "",
  }));
};

const Products = async ({ searchParams }: ProductsPageProps) => {
  const resolvedSearchParams = await searchParams;
  const initialCategory = getSingleSearchParam(resolvedSearchParams.category).trim();
  const initialSearchText = getSingleSearchParam(resolvedSearchParams.search).trim();
  const initialProducts = await getInitialProducts(
    initialCategory,
    initialSearchText
  );

  return (
    <Suspense fallback={<p>Loading products...</p>}>
      <ProductsClient
        initialProducts={initialProducts}
        initialHasMore={initialProducts.length === PAGE_SIZE}
        initialCategory={initialCategory}
        initialSearchText={initialSearchText}
      />
    </Suspense>
  );
};

export default Products;
