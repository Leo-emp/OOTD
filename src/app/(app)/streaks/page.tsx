"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flame, Trophy, Calendar, Check, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRES, GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

// Streak stats from the API
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  thisWeek: number;
  totalDays: number;
  loggedToday: boolean;
  recentDates: string[];
}

export default function StreaksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("old-money");
  const [showLogForm, setShowLogForm] = useState(false);

  // Fetch streak data
  const fetchStreaks = useCallback(async () => {
    try {
      const res = await fetch("/api/streaks");
      if (res.ok) setData(await res.json());
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  // Log today's outfit
  async function handleLog() {
    setLogging(true);
    try {
      const res = await fetch("/api/streaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genreSlug: selectedGenre }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Failed to log", "error");
        return;
      }

      const result = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              currentStreak: result.currentStreak,
              longestStreak: result.longestStreak,
              thisWeek: result.thisWeek,
              totalDays: result.totalDays,
              loggedToday: true,
              recentDates: [new Date().toISOString().split("T")[0], ...prev.recentDates],
            }
          : prev
      );
      setShowLogForm(false);
      toast(
        result.currentStreak > 1
          ? `${result.currentStreak}-day streak! Keep it going!`
          : "Outfit logged! Start building your streak.",
        "success"
      );
    } catch {
      toast("Failed to log outfit", "error");
    } finally {
      setLogging(false);
    }
  }

  // Build calendar grid for the last 30 days
  function buildCalendarDays(): { date: string; logged: boolean; isToday: boolean }[] {
    const days: { date: string; logged: boolean; isToday: boolean }[] = [];
    const today = new Date().toISOString().split("T")[0];
    const loggedSet = new Set(data?.recentDates || []);

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        logged: loggedSet.has(dateStr),
        isToday: dateStr === today,
      });
    }
    return days;
  }

  // Streak tier — unlocks at milestones
  function getStreakTier(streak: number): { name: string; emoji: string; next: number } {
    if (streak >= 30) return { name: "Style Legend", emoji: "👑", next: 0 };
    if (streak >= 14) return { name: "Trendsetter", emoji: "💎", next: 30 };
    if (streak >= 7) return { name: "Style Enthusiast", emoji: "⭐", next: 14 };
    if (streak >= 3) return { name: "Getting Started", emoji: "🌱", next: 7 };
    return { name: "Newcomer", emoji: "👋", next: 3 };
  }

  if (loading) {
    return (
      <main className="px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-white/5" />
          <div className="h-40 rounded-2xl bg-white/5" />
          <div className="h-60 rounded-2xl bg-white/5" />
        </div>
      </main>
    );
  }

  const streak = data?.currentStreak || 0;
  const tier = getStreakTier(streak);
  const calendarDays = buildCalendarDays();

  return (
    <PageTransition>
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-heading text-xl font-bold text-white">Style Streak</h1>
            <p className="text-xs text-neutral-500">Log what you wear, build your streak</p>
          </div>
        </div>

        {/* Streak hero stat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-5 text-center"
        >
          <div className="text-4xl mb-2">{tier.emoji}</div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame size={24} className="text-orange-400" />
            <span className="font-heading text-4xl font-bold text-white">{streak}</span>
          </div>
          <p className="text-sm text-neutral-400">day streak</p>
          <p className="text-xs text-brand-purple mt-1 font-medium">{tier.name}</p>
          {tier.next > 0 && (
            <p className="text-[10px] text-neutral-500 mt-1">
              {tier.next - streak} days to next tier
            </p>
          )}
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="glass rounded-xl p-3 text-center">
            <Trophy size={16} className="mx-auto text-yellow-400 mb-1" />
            <p className="text-lg font-bold text-white">{data?.longestStreak || 0}</p>
            <p className="text-[10px] text-neutral-500">Best Streak</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Calendar size={16} className="mx-auto text-brand-purple mb-1" />
            <p className="text-lg font-bold text-white">{data?.thisWeek || 0}</p>
            <p className="text-[10px] text-neutral-500">This Week</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <Zap size={16} className="mx-auto text-green-400 mb-1" />
            <p className="text-lg font-bold text-white">{data?.totalDays || 0}</p>
            <p className="text-[10px] text-neutral-500">Total Days</p>
          </div>
        </div>

        {/* Log today button or already logged */}
        {data?.loggedToday ? (
          <div className="glass rounded-2xl p-4 mb-5 border border-green-500/20 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <Check size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Logged today!</p>
              <p className="text-xs text-neutral-500">Come back tomorrow to keep your streak</p>
            </div>
          </div>
        ) : (
          <>
            {!showLogForm ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowLogForm(true)}
                className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm flex items-center justify-center gap-2 mb-5 cursor-pointer"
              >
                <Flame size={16} />
                Log Today&apos;s Outfit
              </motion.button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass rounded-2xl p-4 mb-5 overflow-hidden"
                >
                  <p className="text-xs text-neutral-400 mb-3 uppercase tracking-wider">
                    What genre did you wear today?
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {GENRES.map((g) => (
                      <button
                        key={g.slug}
                        onClick={() => setSelectedGenre(g.slug)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                          selectedGenre === g.slug
                            ? "text-white border"
                            : "glass text-neutral-400 hover:text-neutral-200"
                        }`}
                        style={
                          selectedGenre === g.slug
                            ? {
                                backgroundColor: `${GENRE_COLORS[g.slug]}20`,
                                borderColor: `${GENRE_COLORS[g.slug]}50`,
                                color: GENRE_COLORS[g.slug],
                              }
                            : undefined
                        }
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLogForm(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm text-neutral-400 hover:bg-white/10 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLog}
                      disabled={logging}
                      className="flex-1 py-2.5 rounded-xl gradient-bg text-sm text-white font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {logging ? "Logging..." : "Log It"}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}

        {/* 30-day calendar heat map */}
        <div className="glass rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-brand-purple" />
            Last 30 Days
          </h3>
          <div className="grid grid-cols-7 gap-1.5">
            {/* Day headers */}
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-[10px] text-neutral-600 text-center font-medium">
                {d}
              </div>
            ))}
            {/* Fill blank cells for alignment to start of week */}
            {(() => {
              const firstDay = new Date(calendarDays[0].date);
              const dayOfWeek = (firstDay.getDay() + 6) % 7; // Monday=0
              return Array.from({ length: dayOfWeek }, (_, i) => (
                <div key={`blank-${i}`} />
              ));
            })()}
            {/* Calendar cells */}
            {calendarDays.map(({ date, logged, isToday }) => (
              <div
                key={date}
                className={`aspect-square rounded-md flex items-center justify-center text-[10px] transition ${
                  logged
                    ? "bg-brand-purple/30 text-brand-purple font-bold"
                    : isToday
                      ? "bg-white/10 text-white border border-white/20"
                      : "bg-white/[0.03] text-neutral-600"
                }`}
                title={date}
              >
                {new Date(date).getDate()}
              </div>
            ))}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
