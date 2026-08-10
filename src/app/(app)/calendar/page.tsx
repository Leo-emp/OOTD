"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageTransition } from "@/components/ui/PageTransition";

// Day names for the calendar grid header
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarOutfit {
  id: string;
  genreSlug: string;
  occasion: string;
  ratedAt: string;
  rating: string;
  thumbnail: string | null;
}

export default function OutfitCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [outfits, setOutfits] = useState<CalendarOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Current month/year from state
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch saved outfits for calendar display
  useEffect(() => {
    fetch("/api/outfits/saved?all=true")
      .then((r) => r.json())
      .then((data) => {
        // Map to calendar format — extract date + first item thumbnail
        const mapped = (data.outfits || []).map((o: {
          id: string;
          genreSlug: string;
          occasion: string;
          ratedAt: string;
          rating: string;
          items: { imageUrl: string }[];
        }) => ({
          id: o.id,
          genreSlug: o.genreSlug,
          occasion: o.occasion,
          ratedAt: o.ratedAt,
          rating: o.rating,
          thumbnail: o.items?.[0]?.imageUrl || null,
        }));
        setOutfits(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Navigate months
  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  }

  // Build calendar grid data
  const firstDayOfMonth = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group outfits by day of month
  const outfitsByDay: Record<number, CalendarOutfit[]> = {};
  outfits.forEach((o) => {
    const date = new Date(o.ratedAt);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      if (!outfitsByDay[day]) outfitsByDay[day] = [];
      outfitsByDay[day].push(o);
    }
  });

  // Outfits for the selected day
  const selectedOutfits = selectedDay ? outfitsByDay[selectedDay] || [] : [];

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
          <h1 className="font-heading text-xl font-bold text-white">Outfit Calendar</h1>
          <p className="text-xs text-neutral-500">What did you wear?</p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="font-heading text-lg font-semibold text-white">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="glass rounded-2xl p-4 mb-5">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-neutral-500 uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasOutfits = !!outfitsByDay[day];
            const isSelected = selectedDay === day;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const dayOutfits = outfitsByDay[day] || [];
            const thumbnail = dayOutfits[0]?.thumbnail;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-brand-purple bg-brand-purple/20"
                    : hasOutfits
                      ? "bg-white/5 hover:bg-white/10"
                      : "hover:bg-white/5"
                } ${isToday ? "border border-brand-purple/40" : ""}`}
              >
                {/* Thumbnail background for days with outfits */}
                {thumbnail && (
                  <div className="absolute inset-0 opacity-30">
                    <Image src={thumbnail} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                )}
                <span className={`relative text-xs font-medium ${
                  isSelected ? "text-brand-purple" : hasOutfits ? "text-white" : "text-neutral-500"
                }`}>
                  {day}
                </span>
                {/* Dot indicator for outfit days */}
                {hasOutfits && (
                  <span className="relative w-1 h-1 rounded-full bg-brand-purple mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day details */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h3 className="text-sm font-semibold text-white mb-3">
              {MONTHS[month]} {selectedDay}
            </h3>

            {selectedOutfits.length > 0 ? (
              <div className="space-y-3">
                {selectedOutfits.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      // Navigate to outfit detail
                      router.push(`/outfit/${o.id}`);
                    }}
                    className="w-full glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/[0.08] transition cursor-pointer text-left"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-white/5 shrink-0">
                      {o.thumbnail ? (
                        <Image src={o.thumbnail} alt="" fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar size={16} className="text-neutral-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium capitalize truncate">
                        {o.genreSlug.replace(/-/g, " ")}
                      </p>
                      <p className="text-xs text-neutral-500 capitalize">
                        {o.occasion} · {o.rating === "love" ? "Loved" : o.rating}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-neutral-500 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="glass rounded-xl p-6 text-center">
                <p className="text-sm text-neutral-400">No outfits this day</p>
                <p className="text-xs text-neutral-500 mt-1">Browse and save outfits to fill your calendar</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-brand-purple" />
        </div>
      )}
    </main>
    </PageTransition>
  );
}
