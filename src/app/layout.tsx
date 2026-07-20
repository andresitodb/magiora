import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getSiteUrl } from "@/lib/metadata";

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
  style: "normal",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
  style: "normal",
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Magiora",
    template: "%s | Magiora",
  },
  description: "Where ideas become productions.",
  applicationName: "Magiora",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Magiora",
    title: "Magiora",
    description: "Where ideas become productions.",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magiora",
    description: "Where ideas become productions.",
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
