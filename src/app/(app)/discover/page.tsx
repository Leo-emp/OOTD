"use client";

import { Sparkles } from "lucide-react";

export default function DiscoverPage() {
  return (
    <main className="px-4 pt-6">
      <h1 className="font-heading text-2xl font-bold text-white mb-1">
        Discover
      </h1>
      <p className="text-sm text-neutral-400 mb-8">
        Trending styles and curated looks
      </p>
      <div className="glass rounded-2xl p-12 text-center">
        <Sparkles className="mx-auto mb-4 text-brand-purple" size={32} />
        <p className="text-neutral-300 font-medium">Coming soon</p>
        <p className="text-sm text-neutral-500 mt-1">
          Explore trending outfits, steal-this-look, and style boards
        </p>
      </div>
    </main>
  );
}
