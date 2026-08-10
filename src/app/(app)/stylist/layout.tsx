import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Stylist",
  description: "Chat with your personal AI fashion advisor. Get outfit ideas, style ratings, and wardrobe tips for any genre.",
};

export default function StylistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
