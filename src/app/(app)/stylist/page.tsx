"use client";

import { useState } from "react";
import { ChatUI } from "@/components/chat/ChatUI";
import { GenreSelector } from "@/components/genre/GenreSelector";

const GENRES = [
  { slug: "old-money", name: "Old Money" },
  { slug: "y2k", name: "Y2K" },
  { slug: "streetwear", name: "Streetwear" },
  { slug: "minimalist", name: "Minimalist" },
  { slug: "cottagecore", name: "Cottagecore" },
  { slug: "dark-academia", name: "Dark Academia" },
  { slug: "coastal-grandma", name: "Coastal Grandma" },
  { slug: "grunge", name: "Grunge" },
  { slug: "coquette", name: "Coquette" },
  { slug: "gorpcore", name: "Gorpcore" },
  { slug: "clean-girl", name: "Clean Girl" },
  { slug: "indie-boho", name: "Indie/Boho" },
];

export default function StylistPage() {
  const [activeGenre, setActiveGenre] = useState("old-money");

  return (
    <main className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-heading text-2xl font-bold text-white mb-1">
          AI Stylist
        </h1>
        <p className="text-sm text-neutral-400 mb-4">
          Chat with your personal fashion advisor
        </p>
        <GenreSelector
          genres={GENRES}
          activeGenre={activeGenre}
          onSelect={setActiveGenre}
        />
      </div>

      {/* Chat interface — fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <ChatUI genreSlug={activeGenre} />
      </div>
    </main>
  );
}
