import { cn } from "@/lib/utils";

// Skeleton shimmer — matches final layout exactly, never spinners
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-white/5",
        className
      )}
    />
  );
}
