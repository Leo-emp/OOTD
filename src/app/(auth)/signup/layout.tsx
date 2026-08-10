import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join OOTD AI to get AI-powered outfit recommendations across 12 fashion genres. Free to start.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
