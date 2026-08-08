import type { Metadata } from "next";
import MostOrderedClient from "./MostOrderedClient";

export const metadata: Metadata = {
  title: "Most Ordered",
  description:
    "Explore Catelina's most ordered fashion products and customer favorites.",
  alternates: {
    canonical: "/most-ordered",
  },
  openGraph: {
    title: "Most Ordered | embroipoint.com",
    description:
      "Explore Catelina's most ordered fashion products and customer favorites.",
    url: "/most-ordered",
    siteName: "embroipoint.com",
    locale: "en_IN",
    type: "website",
  },
};

export default function MostOrderedPage() {
  return <MostOrderedClient />;
}
