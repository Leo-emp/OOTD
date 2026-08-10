import { Playfair_Display, DM_Sans } from "next/font/google";

// Heading font — Playfair Display (editorial serif, high-fashion magazine feel)
// Gives SSENSE / Net-a-Porter / Vogue editorial aesthetic
export const headingFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Body font — DM Sans (geometric sans, cleaner + more premium than Inter)
// Modern, distinctive letterforms with excellent readability
export const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});
