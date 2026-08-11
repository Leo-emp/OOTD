import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your Style DNA" };

export default function TasteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
