import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Outfits",
  description: "Your saved outfit collection — revisit your favorite AI-curated looks anytime.",
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
