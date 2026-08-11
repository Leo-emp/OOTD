"use client";

import { useState } from "react";
import { ChatUI } from "@/components/chat/ChatUI";
import { GenreSelector } from "@/components/genre/GenreSelector";
import { PageTransition } from "@/components/ui/PageTransition";
import { GENRES } from "@/lib/constants";

export default function StylistPage() {
  const [activeGenre, setActiveGenre] = useState("old-money");

  return (
    <PageTransition className="h-full">
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
    </PageTransition>
  );
}
