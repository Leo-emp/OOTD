import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style Profile",
  description: "Set your body shape, color profile, and fit preferences for personalized outfit recommendations.",
};

export default function StyleProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
