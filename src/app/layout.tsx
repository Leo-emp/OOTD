import type { Metadata } from "next";
import { headingFont, bodyFont } from "@/lib/fonts";
import "./globals.css";

// SEO + social sharing metadata
export const metadata: Metadata = {
  title: "OOTD AI — Your AI-Powered Style Bestie",
  description:
    "Get daily outfit recommendations and personal styling advice powered by AI. Pick your style genre and never stress about what to wear again.",
  keywords: ["fashion", "AI stylist", "outfit recommender", "OOTD", "style guide"],
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
