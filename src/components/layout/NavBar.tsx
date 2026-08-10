"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shirt, MessageCircle, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Bottom navigation bar — mobile-first, always visible on authenticated pages
const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/wardrobe", icon: Shirt, label: "Wardrobe" },
  { href: "/stylist", icon: MessageCircle, label: "Stylist" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-brand-darker/80 backdrop-blur-xl">
      <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition",
                active
                  ? "text-brand-purple"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
