"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Camera, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";

// Personal stylist chat interface — streaming responses, genre-aware
export function ChatUI({ genreSlug }: { genreSlug: string }) {
  const { messages, isStreaming, sendMessage } = useChat(genreSlug);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!input.trim() && !imageBase64) || isStreaming) return;

    const msg = imageBase64
      ? (input.trim() || "Rate my outfit and give me style tips")
      : input.trim();

    sendMessage(msg, imageBase64 || undefined);
    setInput("");
    setImagePreview(null);
    setImageBase64(null);
  }

  // Handle photo upload for outfit rating
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      // Extract base64 data (remove data:image/xxx;base64, prefix)
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl font-heading font-bold gradient-text mb-2">
              Hey bestie!
            </p>
            <p className="text-neutral-400 text-sm max-w-sm mx-auto">
              I'm your AI stylist. Ask me anything about fashion, get outfit ideas, or upload a photo for a style rating.
            </p>
            {/* Quick reply suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                "What should I wear today?",
                "Rate my outfit",
                "Help me build a capsule wardrobe",
                "What's trending right now?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="glass rounded-full px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "gradient-bg text-white"
                    : "glass text-neutral-200"
                }`}
              >
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-brand-purple animate-pulse rounded-full" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview — shows above input when a photo is attached */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className="relative inline-block mb-2">
              <img
                src={imagePreview}
                alt="Outfit to rate"
                className="h-24 w-auto rounded-xl object-cover"
              />
              <button
                onClick={() => { setImagePreview(null); setImageBase64(null); }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white cursor-pointer"
              >
                <X size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 p-4 border-t border-white/5"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition cursor-pointer ${
            imageBase64
              ? "border-brand-purple/50 bg-brand-purple/10 text-brand-purple"
              : "border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
          }`}
          aria-label="Upload photo for rating"
        >
          <Camera size={18} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={imageBase64 ? "Add a message (optional)..." : "Ask your stylist..."}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-brand-purple focus:outline-none"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={(!input.trim() && !imageBase64) || isStreaming}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-bg text-white transition hover:opacity-90 disabled:opacity-30 cursor-pointer"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
