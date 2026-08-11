"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Swords, Check, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GENRE_COLORS } from "@/lib/constants";
import { PageTransition } from "@/components/ui/PageTransition";

// Challenge data from the API
interface Challenge {
  id: string;
  title: string;
  description: string;
  genreSlug: string;
  durationDays: number;
  difficulty: string;
  badgeEmoji: string;
  dailyTips: string[];
  joined: boolean;
  status: string | null;
  completedDays: string[];
  daysRemaining: number;
  startDate: string | null;
}

export default function ChallengesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badgesEarned, setBadgesEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges);
        setBadgesEarned(data.badgesEarned);
      }
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Join a challenge
  async function handleJoin(challengeId: string) {
    setActionLoading(challengeId);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", challengeId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Failed to join", "error");
        return;
      }
      toast("Challenge accepted! Log your outfits daily.", "success");
      fetchChallenges();
    } catch {
      toast("Failed to join challenge", "error");
    } finally {
      setActionLoading(null);
    }
  }

  // Log today for a challenge
  async function handleLogDay(challengeId: string) {
    setActionLoading(challengeId);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "log", challengeId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error || "Failed to log", "error");
        return;
      }
      const result = await res.json();
      if (result.isComplete) {
        toast(`Challenge complete! You earned ${result.badgeEmoji}`, "success");
      } else {
        toast(`Day logged! ${result.daysRemaining} days remaining.`, "success");
      }
      fetchChallenges();
    } catch {
      toast("Failed to log day", "error");
    } finally {
      setActionLoading(null);
    }
  }

  // Difficulty badge color
  function difficultyColor(d: string): string {
    if (d === "easy") return "text-green-400 bg-green-400/10";
    if (d === "medium") return "text-yellow-400 bg-yellow-400/10";
    return "text-red-400 bg-red-400/10";
  }

  if (loading) {
    return (
      <main className="px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded bg-white/5" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5" />
          ))}
        </div>
      </main>
    );
  }

  // Sort: active challenges first, then available, then completed
  const sorted = [...challenges].sort((a, b) => {
    const order = (c: Challenge) => {
      if (c.status === "active") return 0;
      if (!c.joined) return 1;
      if (c.status === "completed") return 2;
      return 3;
    };
    return order(a) - order(b);
  });

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
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold text-white">Style Challenges</h1>
            <p className="text-xs text-neutral-500">Try a new genre, earn badges</p>
          </div>
          {/* Badges count */}
          <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
            <Trophy size={14} className="text-yellow-400" />
            <span className="text-sm font-bold text-white">{badgesEarned}</span>
          </div>
        </div>

        {/* Challenge cards */}
        <div className="space-y-3">
          <AnimatePresence>
            {sorted.map((c, i) => {
              const isExpanded = expandedId === c.id;
              const accentColor = GENRE_COLORS[c.genreSlug] || "#8B5CF6";
              const today = new Date().toISOString().split("T")[0];
              const loggedToday = c.completedDays.includes(today);
              const progress = c.joined ? c.completedDays.length / c.durationDays : 0;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl overflow-hidden"
                  style={{ borderLeft: `3px solid ${accentColor}` }}
                >
                  {/* Card header — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="w-full p-4 text-left cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{c.badgeEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold text-white truncate">{c.title}</h3>
                          {c.status === "completed" && (
                            <Check size={14} className="text-green-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-1">{c.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${difficultyColor(c.difficulty)}`}>
                            {c.difficulty}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            {c.durationDays} days
                          </span>
                          {c.status === "active" && (
                            <span className="text-[10px] text-brand-purple font-medium">
                              {c.daysRemaining} left
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-neutral-500">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Progress bar for active challenges */}
                    {c.status === "active" && (
                      <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress * 100}%` }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                      </div>
                    )}
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-white/5">
                          {/* Daily tips */}
                          <div className="mt-3 space-y-2">
                            {c.dailyTips.map((tip, j) => {
                              const dayDone = c.joined && j < c.completedDays.length;
                              return (
                                <div
                                  key={j}
                                  className={`flex items-start gap-2 text-xs ${
                                    dayDone ? "text-neutral-500 line-through" : "text-neutral-300"
                                  }`}
                                >
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded-full shrink-0 mt-0.5 ${
                                      dayDone ? "bg-green-500/20" : "bg-white/5"
                                    }`}
                                  >
                                    {dayDone ? (
                                      <Check size={10} className="text-green-400" />
                                    ) : (
                                      <span className="text-[8px] text-neutral-500">{j + 1}</span>
                                    )}
                                  </div>
                                  {tip}
                                </div>
                              );
                            })}
                          </div>

                          {/* Action button */}
                          <div className="mt-4">
                            {c.status === "completed" ? (
                              <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-400">
                                <Trophy size={16} />
                                Challenge Complete!
                              </div>
                            ) : c.status === "active" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLogDay(c.id);
                                }}
                                disabled={loggedToday || actionLoading === c.id}
                                className="w-full py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                                style={{
                                  backgroundColor: loggedToday ? "rgba(255,255,255,0.05)" : `${accentColor}20`,
                                  color: loggedToday ? "#737373" : accentColor,
                                }}
                              >
                                {actionLoading === c.id
                                  ? "Logging..."
                                  : loggedToday
                                    ? "Done for today"
                                    : `Log Day ${c.completedDays.length + 1}`}
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoin(c.id);
                                }}
                                disabled={actionLoading === c.id}
                                className="w-full py-2.5 rounded-xl gradient-bg text-sm text-white font-semibold disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                              >
                                {actionLoading === c.id ? (
                                  "Joining..."
                                ) : (
                                  <>
                                    <Swords size={14} />
                                    Accept Challenge
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </PageTransition>
  );
}
