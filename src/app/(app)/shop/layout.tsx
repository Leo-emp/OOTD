import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop For You" };

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
