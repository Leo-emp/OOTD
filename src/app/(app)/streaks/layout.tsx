import type { Metadata } from "next";

export const metadata: Metadata = { title: "Style Streak" };

export default function StreaksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
