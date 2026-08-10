import type { Metadata, Viewport } from "next";
import { headingFont, bodyFont } from "@/lib/fonts";
import "./globals.css";

// Global SEO + social sharing metadata
export const metadata: Metadata = {
  title: {
    default: "OOTD AI — Your AI-Powered Style Bestie",
    template: "%s | OOTD AI",
  },
  description:
    "Get daily outfit recommendations and personal styling advice powered by AI. Pick your style genre and never stress about what to wear again.",
  keywords: ["fashion", "AI stylist", "outfit recommender", "OOTD", "style guide", "personal stylist", "wardrobe", "outfit ideas"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ootd-ai.vercel.app"),
  openGraph: {
    type: "website",
    siteName: "OOTD AI",
    title: "OOTD AI — Your AI-Powered Style Bestie",
    description: "AI-powered outfit recommendations across 12 fashion genres. Upload your wardrobe, get styled daily.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OOTD AI — Your AI-Powered Style Bestie",
    description: "AI-powered outfit recommendations across 12 fashion genres.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OOTD AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F0B15",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
