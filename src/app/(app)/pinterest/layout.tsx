import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pinterest Vibe Match",
  description: "Analyze your Pinterest boards and pins to discover your fashion genre breakdown.",
};

export default function PinterestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
