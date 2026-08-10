import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "View your style stats, manage your Pro subscription, and see your Style DNA breakdown.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
