import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover",
  description: "Browse 600+ curated fashion pieces across 12 style genres from 100+ brands. Filter by category, brand, and price.",
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
