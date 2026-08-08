export const getBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.embroipoint.com";

  return url.replace(/\/$/, "");
};
