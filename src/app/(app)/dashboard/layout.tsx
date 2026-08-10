import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Outfits",
  description: "Swipe through AI-curated outfit recommendations personalized to your style genre and occasion.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
