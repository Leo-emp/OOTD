"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Flame, Swords, Heart, MessageCircle, UserPlus, ShoppingBag } from "lucide-react";
import Link from "next/link";

// Notification shape from API
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
}

// Icon + color per notification type
function typeIcon(type: string) {
  switch (type) {
    case "streak_reminder": return { icon: Flame, color: "text-orange-400" };
    case "challenge_ending": return { icon: Swords, color: "text-red-400" };
    case "post_liked": return { icon: Heart, color: "text-pink-400" };
    case "post_comment": return { icon: MessageCircle, color: "text-blue-400" };
    case "new_follower": return { icon: UserPlus, color: "text-brand-purple" };
    case "shopping_alert": return { icon: ShoppingBag, color: "text-green-400" };
    default: return { icon: Bell, color: "text-neutral-400" };
  }
}

// Time-ago display
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, []);

  // Initial load + poll every 60s
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Mark all visible unread as read when panel opens
  useEffect(() => {
    if (!open || unreadCount === 0) return;
    const unreadIds = notifs.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    }).then(() => {
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }).catch(() => {});
  }, [open, unreadCount, notifs]);

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 max-h-[400px] overflow-y-auto rounded-2xl border border-white/10 bg-brand-darker/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="p-3 border-b border-white/5">
              <p className="text-sm font-semibold text-white">Notifications</p>
            </div>

            {notifs.length === 0 ? (
              <div className="p-6 text-center">
                <Bell size={24} className="mx-auto text-neutral-600 mb-2" />
                <p className="text-xs text-neutral-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifs.slice(0, 20).map((n) => {
                  const { icon: Icon, color } = typeIcon(n.type);
                  const content = (
                    <div
                      className={`flex gap-3 p-3 transition hover:bg-white/5 ${!n.read ? "bg-brand-purple/5" : ""}`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/5 shrink-0 ${color}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">{n.title}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-neutral-600 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <div className="h-2 w-2 rounded-full bg-brand-purple shrink-0 mt-1" />
                      )}
                    </div>
                  );

                  return n.actionUrl ? (
                    <Link key={n.id} href={n.actionUrl} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
