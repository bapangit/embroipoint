import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

import { getBaseUrl } from "@/lib/siteUrl";
import styles from "./Page.module.css";
import Providers from "./providers";
import Header from "./components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "embroipoint.com",
    template: "%s | embroipoint.com",
  },
  description: "Shop curated fashion products at embroipoint.com",
  openGraph: {
    title: "embroipoint.com",
    description: "Shop curated fashion products at embroipoint.com",
    url: "/",
    siteName: "embroipoint.com",
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <main className={styles.main}>
            <Header styles={styles} />
            {children}
            <footer className={styles.footer}>
              <div className={styles.footer_inner}>
                <section className={styles.footer_brand} aria-label="Store information">
                  <Link href="/" className={styles.footer_logo}>
                    Ecom App
                  </Link>
                  <p>
                    Curated everyday fashion, thoughtful picks, and quick
                    checkout for your next favorite find.
                  </p>
                </section>

                <nav className={styles.footer_nav} aria-label="Footer navigation">
                  <div>
                    <h2>Shop</h2>
                    <ul>
                      <li>
                        <Link href="/products">Products</Link>
                      </li>
                      <li>
                        <Link href="/categories">Categories</Link>
                      </li>
                      <li>
                        <Link href="/most-ordered">Most Ordered</Link>
                      </li>
                      <li>
                        <Link href="/about">About Us</Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h2>Account</h2>
                    <ul>
                      <li>
                        <Link href="/profile">Profile</Link>
                      </li>
                      <li>
                        <Link href="/orders">Orders</Link>
                      </li>
                      <li>
                        <Link href="/address">Addresses</Link>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h2>Support</h2>
                    <ul>
                      <li>
                        <a href="mailto:support@embroipoint.com">support@embroipoint.com</a>
                      </li>
                      <li>
                        <span>Mon-Sat, 10 AM-7 PM</span>
                      </li>
                      <li>
                        <span>Free shipping on select orders</span>
                      </li>
                    </ul>
                  </div>
                </nav>
              </div>

              <div className={styles.footer_bottom}>
                <p>(c) 2026 embroipoint.com. All rights reserved.</p>
              </div>
            </footer>
          </main>
        </Providers>
      </body>
    </html>
  );
}
