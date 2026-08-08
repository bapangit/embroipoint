export const createProductSlug = (title?: string | null) => {
  const slug = (title || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "product";
};

export const getProductPath = (
  product: { _id: string | { toString(): string }; title?: string | null }
) => `/product/${createProductSlug(product.title)}/${String(product._id)}`;
