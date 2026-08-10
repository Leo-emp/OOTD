import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style Quiz",
  description: "Take a quick 5-question quiz to discover your Style DNA — your unique blend of fashion genres.",
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
