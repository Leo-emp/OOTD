import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rate My Outfit",
  description: "Upload a photo and get instant AI feedback — score, genre alignment, and improvement tips.",
};

export default function RateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
