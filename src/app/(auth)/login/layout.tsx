import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to OOTD AI to access your personalized outfit recommendations and AI stylist.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
