import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outfit Calendar",
  description: "Plan your outfits by day — schedule looks and track what you wear.",
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
