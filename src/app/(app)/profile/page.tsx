"use client";

import { useSession, signOut } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { LogOut, Crown } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <main className="px-4 pt-6">
      <h1 className="font-heading text-2xl font-bold text-white mb-6">
        Profile
      </h1>

      {/* User info card */}
      <div className="glass rounded-2xl p-6 space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-bg text-xl font-bold text-white">
            {session?.user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-heading font-semibold text-white">
              {session?.user?.name || "User"}
            </p>
            <p className="text-sm text-neutral-400">
              {session?.user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Pro upgrade card */}
      <div className="glass rounded-2xl p-6 mb-6 border border-brand-purple/20">
        <div className="flex items-center gap-3 mb-3">
          <Crown className="text-brand-purple" size={20} />
          <h3 className="font-heading font-semibold text-white">Upgrade to Pro</h3>
        </div>
        <p className="text-sm text-neutral-400 mb-4">
          50 outfits/day, 200 chat messages, unlimited wardrobe
        </p>
        <p className="text-sm font-medium text-white mb-4">
          $24.99/month or $199/year
        </p>
        <button className="w-full gradient-bg rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 cursor-pointer">
          Upgrade Now
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-400 transition hover:text-white hover:bg-white/10 cursor-pointer"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </main>
  );
}
