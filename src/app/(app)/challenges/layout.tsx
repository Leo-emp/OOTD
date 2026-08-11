import type { Metadata } from "next";

export const metadata: Metadata = { title: "Style Challenges" };

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
