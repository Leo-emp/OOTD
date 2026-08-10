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

// Skeleton for an outfit card — matches OutfitCard layout
export function OutfitCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {/* Title + genre badge */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Item grid — 2 large + 3 small */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="aspect-[3/4] rounded-xl" />
        <Skeleton className="aspect-[3/4] rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="aspect-[3/4] rounded-xl" />
        <Skeleton className="aspect-[3/4] rounded-xl" />
        <Skeleton className="aspect-[3/4] rounded-xl" />
      </div>
      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  );
}
