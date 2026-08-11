"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Link2, Sparkles, ShoppingBag, Palette, ExternalLink, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Suspense } from "react";
import { GENRE_COLORS } from "@/lib/constants";

interface VibeResult {
  genres: { slug: string; name: string; percentage: number }[];
  palette: string[];
  aesthetic: string;
  styleNotes: string[];
  mood: string[];
  type: "board" | "pin";
  pinCount?: number;
  pinTitle?: string;
}

interface Board {
  id: string;
  name: string;
  description: string;
  pinCount: number;
  imageUrl: string | null;
}

interface ShopItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  category: string;
}

export default function PinterestPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6"><div className="h-8 w-32 rounded bg-white/5 animate-pulse" /></div>}>
      <PinterestContent />
    </Suspense>
  );
}

function PinterestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [connected, setConnected] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [vibeResult, setVibeResult] = useState<VibeResult | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"vibe" | "shop">("vibe");

  // Check connection status on mount
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      toast("Pinterest connected!", "success");
    }
    if (searchParams.get("error")) {
      toast("Pinterest connection failed", "error");
    }

    fetch("/api/pinterest/boards")
      .then((r) => r.json())
      .then((data) => {
        setConnected(data.connected);
        setBoards(data.boards || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams, toast]);

  // Connect to Pinterest via OAuth
  async function handleConnect() {
    window.location.href = "/api/pinterest/auth";
  }

  // Analyze a board by ID
  async function analyzeBoard(boardId: string) {
    setAnalyzing(true);
    setVibeResult(null);
    try {
      const res = await fetch("/api/pinterest/vibe-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setVibeResult(data);
      toast("Vibe analysis complete!", "success");
    } catch {
      toast("Failed to analyze board", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  // Analyze a URL (board or pin)
  async function analyzeUrl() {
    if (!urlInput.trim()) return;
    setAnalyzing(true);
    setVibeResult(null);
    setShopItems([]);

    try {
      // If "shop" tab is active, use shop-pin endpoint
      if (activeTab === "shop") {
        const res = await fetch("/api/pinterest/shop-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlInput.trim() }),
        });
        if (!res.ok) throw new Error("Shop failed");
        const data = await res.json();
        setVibeResult(data.vibeMatch);
        setShopItems(data.similarItems || []);
        toast("Found similar items!", "success");
      } else {
        // Vibe match
        const res = await fetch("/api/pinterest/vibe-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlInput.trim() }),
        });
        if (!res.ok) throw new Error("Analysis failed");
        const data = await res.json();
        setVibeResult(data);
        toast("Vibe analysis complete!", "success");
      }
    } catch {
      toast("Analysis failed. Check the URL and try again.", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-heading text-xl font-bold text-white">Pinterest Style</h1>
          <p className="text-xs text-neutral-500">Turn pins into outfits</p>
        </div>
      </div>

      {/* Tabs — Vibe Match vs Shop the Pin */}
      <div className="flex gap-2 mb-5">
        {[
          { key: "vibe" as const, label: "Vibe Match", icon: Sparkles },
          { key: "shop" as const, label: "Shop the Pin", icon: ShoppingBag },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setVibeResult(null); setShopItems([]); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition cursor-pointer ${
              activeTab === key
                ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                : "glass text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Not connected state */}
      {!loading && !connected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 text-center mb-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#E60023">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-white mb-2">Connect Pinterest</h3>
          <p className="text-sm text-neutral-400 mb-5">
            {activeTab === "vibe"
              ? "Analyze your boards and discover which OOTD AI genres match your aesthetic"
              : "Find affordable alternatives for any pin in our catalog"}
          </p>
          <button
            onClick={handleConnect}
            className="w-full py-3 rounded-xl gradient-bg text-white font-semibold text-sm cursor-pointer"
          >
            Connect Pinterest
          </button>
        </motion.div>
      )}

      {/* URL input — works for both vibe match and shop the pin */}
      {connected && (
        <div className="glass rounded-2xl p-4 mb-5">
          <label className="text-xs text-neutral-400 uppercase tracking-wider mb-2 block">
            {activeTab === "vibe" ? "Paste a board or pin URL" : "Paste a pin URL"}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="pinterest.com/..."
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-brand-purple"
                onKeyDown={(e) => e.key === "Enter" && analyzeUrl()}
              />
            </div>
            <button
              onClick={analyzeUrl}
              disabled={analyzing || !urlInput.trim()}
              className="rounded-xl gradient-bg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {activeTab === "vibe" ? "Match" : "Shop"}
            </button>
          </div>
        </div>
      )}

      {/* Board selector — quick access to analyze saved boards */}
      {connected && boards.length > 0 && activeTab === "vibe" && !vibeResult && (
        <div className="mb-5">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Or pick a board</p>
          <div className="grid grid-cols-2 gap-3">
            {boards.slice(0, 6).map((board) => (
              <button
                key={board.id}
                onClick={() => analyzeBoard(board.id)}
                disabled={analyzing}
                className="glass rounded-xl overflow-hidden text-left transition hover:bg-white/[0.08] disabled:opacity-50 cursor-pointer"
              >
                {board.imageUrl && (
                  <div className="relative h-24 w-full">
                    <Image src={board.imageUrl} alt={board.name} fill className="object-cover" sizes="200px" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate">{board.name}</p>
                  <p className="text-[10px] text-neutral-500">{board.pinCount} pins</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {analyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-8 text-center"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-brand-purple mx-auto mb-4" />
          <p className="text-sm text-neutral-300">
            {activeTab === "vibe" ? "Analyzing aesthetic..." : "Finding similar items..."}
          </p>
          <p className="text-xs text-neutral-500 mt-1">This takes 5-10 seconds</p>
        </motion.div>
      )}

      {/* Vibe Match Results */}
      <AnimatePresence>
        {vibeResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Genre breakdown */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Palette size={14} className="text-brand-purple" />
                Your Vibe = OOTD Genres
              </h3>
              <div className="space-y-3">
                {vibeResult.genres.map((genre) => (
                  <div key={genre.slug}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-medium">{genre.name}</span>
                      <span className="text-xs text-neutral-400">{genre.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${genre.percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: GENRE_COLORS[genre.slug] || "#C084FC" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action — browse as this genre */}
              <button
                onClick={() => router.push(`/dashboard?genre=${vibeResult.genres[0].slug}`)}
                className="w-full mt-4 py-2.5 rounded-xl gradient-bg text-sm font-medium text-white cursor-pointer"
              >
                Browse {vibeResult.genres[0].name} outfits
              </button>
            </div>

            {/* Aesthetic description */}
            <div className="glass rounded-2xl p-5">
              <p className="text-sm text-neutral-300 leading-relaxed italic">
                &ldquo;{vibeResult.aesthetic}&rdquo;
              </p>
            </div>

            {/* Color palette */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Color Palette</h3>
              <div className="flex gap-2">
                {vibeResult.palette.map((color) => (
                  <div key={color} className="flex flex-col items-center gap-1.5">
                    <div
                      className="h-10 w-10 rounded-xl border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-neutral-500 capitalize">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Style notes */}
            {vibeResult.styleNotes.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h3 className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Style Notes</h3>
                <ul className="space-y-2">
                  {vibeResult.styleNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                      <span className="w-1 h-1 rounded-full bg-brand-purple shrink-0 mt-2" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mood tags */}
            <div className="flex flex-wrap gap-2">
              {vibeResult.mood.map((m) => (
                <span key={m} className="glass rounded-full px-3 py-1.5 text-xs text-neutral-300 capitalize">
                  {m}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop the Pin Results */}
      <AnimatePresence>
        {shopItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ShoppingBag size={14} className="text-brand-purple" />
              Similar in our catalog
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {shopItems.map((item) => (
                <a
                  key={item.id}
                  href={item.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-xl overflow-hidden group transition hover:bg-white/[0.08]"
                >
                  <div className="relative aspect-[3/4]">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 200px"
                      />
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                      <ExternalLink size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{item.brand}</p>
                    <p className="text-xs text-brand-purple font-semibold mt-1">${item.price}</p>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
