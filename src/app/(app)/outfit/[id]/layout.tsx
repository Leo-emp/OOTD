import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outfit Details",
  description: "View outfit items, styling explanation, and shop the look.",
};

export default function OutfitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
