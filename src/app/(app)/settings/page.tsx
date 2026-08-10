"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "@/lib/auth/client";
import { ArrowLeft, Download, Trash2, Shield } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Export user data — downloads all personal data as JSON
  async function handleExport() {
    setExporting(true);
    try {
      // Fetch all user-facing data endpoints
      const [style, styling, wardrobe, saved, history, chat] = await Promise.all([
        fetch("/api/user/style").then((r) => r.json()).catch(() => null),
        fetch("/api/profile/styling").then((r) => r.json()).catch(() => null),
        fetch("/api/wardrobe").then((r) => r.json()).catch(() => null),
        fetch("/api/outfits/saved").then((r) => r.json()).catch(() => null),
        fetch("/api/outfits/saved?all=true").then((r) => r.json()).catch(() => null),
        fetch("/api/chat").then((r) => r.json()).catch(() => null),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        styleProfile: style,
        bodyAndColorProfile: styling?.profile,
        wardrobe: wardrobe?.items,
        savedOutfits: saved?.outfits,
        outfitHistory: history?.outfits,
        chatHistory: chat,
      };

      // Trigger download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ootd-ai-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export failed
    }
    setExporting(false);
  }

  // Delete account — removes all user data
  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        await signOut();
        router.push("/");
      }
    } catch {
      // Delete failed
    }
    setDeleting(false);
  }

  return (
    <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="space-y-4">
        {/* Data & Privacy section */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-brand-purple" />
            <h3 className="font-heading font-semibold text-white">Data & Privacy</h3>
          </div>

          {/* Export data */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-3 w-full p-3 rounded-xl transition hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          >
            <Download size={18} className="text-neutral-400" />
            <div className="text-left">
              <p className="text-sm text-white font-medium">
                {exporting ? "Preparing download..." : "Export My Data"}
              </p>
              <p className="text-xs text-neutral-500">Download all your data as JSON</p>
            </div>
          </button>

          {/* Delete account */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-3 w-full p-3 rounded-xl transition hover:bg-red-500/5 cursor-pointer mt-1"
          >
            <Trash2 size={18} className="text-red-400" />
            <div className="text-left">
              <p className="text-sm text-red-400 font-medium">Delete Account</p>
              <p className="text-xs text-neutral-500">Permanently delete all your data</p>
            </div>
          </button>
        </div>

        {/* About */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-white mb-3">About</h3>
          <div className="space-y-2 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-neutral-300">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>AI Model</span>
              <span className="text-neutral-300">Gemini 2.5 Flash</span>
            </div>
            <div className="flex justify-between">
              <span>Style Genres</span>
              <span className="text-neutral-300">12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="font-heading text-lg font-bold text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-neutral-400 mb-6">
              This will permanently delete your account, wardrobe, style profile, saved outfits, and chat history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500/20 border border-red-500/30 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/30 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
