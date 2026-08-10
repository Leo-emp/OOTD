import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wardrobe",
  description: "Upload your clothes, get AI categorization, and see them mixed into your outfit recommendations.",
};

export default function WardrobeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
