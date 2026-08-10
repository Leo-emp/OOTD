"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signOut } from "@/lib/auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { StyleDnaCard } from "@/components/profile/StyleDnaCard";

// Wrapper to provide Suspense boundary for useSearchParams
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6"><div className="h-8 w-32 rounded bg-white/5 animate-pulse" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [styleProfile, setStyleProfile] = useState<{
    hasProfile: boolean;
    primaryGenre?: string;
    secondaryGenre?: string | null;
    accentGenre?: string | null;
  } | null>(null);

  // Fetch real plan + style profile on mount
  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.json())
      .then((data) => { if (data.plan) setPlan(data.plan); })
      .catch(() => {});
    fetch("/api/user/style")
      .then((r) => r.json())
      .then((data) => setStyleProfile(data))
      .catch(() => {});
  }, []);

  // Check if user just upgraded (redirected from Stripe)
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowUpgradeSuccess(true);
      setPlan("pro");
      window.history.replaceState({}, "", "/profile");
      setTimeout(() => setShowUpgradeSuccess(false), 5000);
    }
  }, [searchParams]);

  async function handleUpgrade(billingCycle: "monthly" | "yearly") {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billingCycle }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch {
      // Network error
    }
    setUpgrading(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-bold text-white mb-6">Profile</h1>

      {/* Upgrade success banner */}
      <AnimatePresence>
        {showUpgradeSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 mb-6"
          >
            <p className="text-sm text-green-400 font-medium">Welcome to Pro! Your limits have been upgraded.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User info card */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-bg text-xl font-bold text-white shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-heading font-semibold text-white truncate">
                {session?.user?.name || "User"}
              </p>
              {plan === "pro" && (
                <span className="shrink-0 px-2 py-0.5 rounded-full gradient-bg text-[10px] font-bold uppercase tracking-wider">
                  Pro
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-400 truncate">
              {session?.user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Style DNA card — shows genre breakdown from quiz */}
      {styleProfile?.hasProfile && styleProfile.primaryGenre && (
        <div className="mb-6">
          <StyleDnaCard
            primaryGenre={styleProfile.primaryGenre}
            secondaryGenre={styleProfile.secondaryGenre}
            accentGenre={styleProfile.accentGenre}
          />
        </div>
      )}

      {/* Plan section */}
      {plan === "free" ? (
        <div className="glass rounded-2xl p-6 mb-6 border border-brand-400/20">
          <div className="flex items-center gap-3 mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-brand-400">
              <path d="M10 2L12.09 7.26L18 8L13.5 12.12L14.82 18L10 15.27L5.18 18L6.5 12.12L2 8L7.91 7.26L10 2Z" fill="currentColor" />
            </svg>
            <h3 className="font-heading font-semibold text-white">Upgrade to Pro</h3>
          </div>

          <ul className="space-y-2 text-sm text-neutral-300 mb-5">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-brand-400" /> 50 outfits / day (vs 3)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-brand-400" /> 200 stylist chats / day (vs 5)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-brand-400" /> Unlimited wardrobe uploads
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-brand-400" /> Priority AI responses
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-brand-400" /> Style DNA card
            </li>
          </ul>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleUpgrade("monthly")}
              disabled={upgrading}
              className="rounded-xl gradient-bg px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <span className="block text-base">$24.99</span>
              <span className="text-[10px] opacity-70">per month</span>
            </button>
            <button
              onClick={() => handleUpgrade("yearly")}
              disabled={upgrading}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50 relative"
            >
              <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-green-500/20 text-[9px] text-green-400 font-bold">
                SAVE 33%
              </span>
              <span className="block text-base">$199</span>
              <span className="text-[10px] opacity-70">per year</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-white">Pro Plan</h3>
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-xs text-green-400">Active</span>
          </div>
          <p className="text-sm text-neutral-400 mb-4">
            You have access to all premium features
          </p>
          <button
            onClick={async () => {
              const res = await fetch("/api/stripe/portal", { method: "POST" });
              if (res.ok) {
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }
            }}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            Manage billing →
          </button>
        </div>
      )}

      {/* App info */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h3 className="font-heading font-semibold text-white mb-3">Your Style Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-white">12</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Genres</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">661+</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Products</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">100+</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Brands</p>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-400 transition hover:text-white hover:bg-white/10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sign Out
      </button>
    </main>
  );
}
