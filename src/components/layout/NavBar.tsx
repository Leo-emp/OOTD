"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Shirt, MessageCircle, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Bottom navigation items — each maps to a top-level app route
// Feed replaces Saved (Saved is accessible from Profile page)
const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/wardrobe", icon: Shirt, label: "Wardrobe" },
  { href: "/stylist", icon: MessageCircle, label: "Stylist" },
  { href: "/feed", icon: Users, label: "Community" },
  { href: "/profile", icon: User, label: "Profile" },
];

// Premium bottom nav — animated active pill, spring icon bounce, staggered mount
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-brand-darker/80 backdrop-blur-xl">
      <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }, index) => {
          // Check if this nav item is active
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                active
                  ? "text-brand-purple"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              {/* Active pill indicator — animated layout transition */}
              {active && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-lg bg-brand-purple/10 border border-brand-purple/20"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                />
              )}

              {/* Icon — spring bounce on active change */}
              <motion.div
                initial={false}
                animate={{
                  scale: active ? 1 : 0.9,
                  y: active ? -1 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 25,
                }}
                className="relative z-10"
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.5}
                />
              </motion.div>

              {/* Label — slightly bolder when active */}
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={cn(
                  "relative z-10 text-[10px]",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {label}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
