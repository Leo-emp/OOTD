import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes safely — handles conflicts like "p-4 p-8" → "p-8"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
