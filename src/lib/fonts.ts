import { Inter, Plus_Jakarta_Sans } from "next/font/google";

// Heading font — Plus Jakarta Sans (geometric, modern)
// Swap to Satoshi later: download from fontshare.com → public/fonts/ → use next/font/local
export const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

// Body font — Inter (clean, readable at all sizes)
export const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
