"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// All 12 genres with their accent colors (matches globals.css genre system)
const GENRES = [
  { name: "Old Money", slug: "old-money", color: "#C9B99A" },
  { name: "Y2K", slug: "y2k", color: "#FF69B4" },
  { name: "Streetwear", slug: "streetwear", color: "#FF4500" },
  { name: "Minimalist", slug: "minimalist", color: "#A0A0A0" },
  { name: "Cottagecore", slug: "cottagecore", color: "#8FBC8F" },
  { name: "Dark Academia", slug: "dark-academia", color: "#8B4513" },
  { name: "Coastal Grandma", slug: "coastal-grandma", color: "#87CEEB" },
  { name: "Grunge", slug: "grunge", color: "#696969" },
  { name: "Coquette", slug: "coquette", color: "#FFB6C1" },
  { name: "Gorpcore", slug: "gorpcore", color: "#556B2F" },
  { name: "Clean Girl", slug: "clean-girl", color: "#D4A574" },
  { name: "Indie/Boho", slug: "indie-boho", color: "#CD853F" },
];

// Feature highlights — the core value props
const FEATURES = [
  {
    title: "AI Outfit Engine",
    description: "Get complete outfits curated by AI across 12 style genres — from $15 SHEIN to $2,000+ Loro Piana",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Personal Stylist Chat",
    description: "Real-time fashion advice with photo analysis — upload any outfit for instant expert feedback",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Smart Wardrobe",
    description: "Upload your clothes — AI categorizes, removes backgrounds, and builds outfits from what you own",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Shop with One Tap",
    description: "Every item links directly to the store — earn while you look good with affiliate partnerships",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// Stagger animation config
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* Hero section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-400/5 via-transparent to-transparent pointer-events-none" />

        {/* Animated entrance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-neutral-300">Powered by Gemini 2.5 Flash</span>
          </motion.div>

          {/* Logo */}
          <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl font-bold gradient-text mb-4">
            OOTD AI
          </h1>

          {/* Tagline */}
          <p className="text-lg sm:text-xl text-neutral-400 max-w-md mx-auto mb-3">
            Your AI-powered style bestie
          </p>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-10">
            Complete outfit recommendations across 12 style genres. From budget finds to luxury picks —
            curated by AI, shoppable in one tap.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/quiz">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm tracking-wide shadow-lg shadow-brand-400/20 transition-shadow hover:shadow-brand-400/30"
              >
                Find Your Style
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 rounded-xl bg-white/5 text-neutral-300 font-medium text-sm border border-white/10 hover:bg-white/10 transition-colors"
              >
                Sign In
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* Genre showcase */}
      <section className="px-4 py-20 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <p className="text-xs text-neutral-500 uppercase tracking-widest text-center mb-3">
            12 Style Genres
          </p>
          <h2 className="font-heading text-3xl font-bold text-white text-center mb-10">
            Every aesthetic. One app.
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-wrap justify-center gap-2.5"
        >
          {GENRES.map((genre) => (
            <motion.span
              key={genre.slug}
              variants={itemVariants}
              className="glass px-4 py-2 rounded-full text-sm text-neutral-300 hover:text-white transition-all duration-300 cursor-default flex items-center gap-2"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: genre.color }}
              />
              {genre.name}
            </motion.span>
          ))}
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="px-4 py-20 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <p className="text-xs text-neutral-500 uppercase tracking-widest text-center mb-3">
            Features
          </p>
          <h2 className="font-heading text-3xl font-bold text-white text-center mb-10">
            AI that understands style
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="glass rounded-2xl p-6 group hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-400/10 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-400/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="font-heading font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pricing preview */}
      <section className="px-4 py-20 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-10"
        >
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="font-heading text-3xl font-bold text-white">Start free, go Pro</h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Free tier */}
          <motion.div variants={itemVariants} className="glass rounded-2xl p-6">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Free</p>
            <p className="font-heading text-3xl font-bold text-white mb-4">$0</p>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-500" /> 3 outfits / day
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-500" /> 5 stylist chats / day
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-500" /> 20 wardrobe uploads
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-500" /> All 12 genres
              </li>
            </ul>
          </motion.div>

          {/* Pro tier */}
          <motion.div variants={itemVariants} className="relative glass rounded-2xl p-6 border border-brand-400/20">
            <span className="absolute -top-2.5 left-6 px-2.5 py-0.5 rounded-full gradient-bg text-[10px] font-semibold text-white uppercase tracking-wider">
              Popular
            </span>
            <p className="text-xs text-brand-400 uppercase tracking-wider mb-1">Pro</p>
            <div className="flex items-baseline gap-1 mb-4">
              <p className="font-heading text-3xl font-bold text-white">$24.99</p>
              <span className="text-xs text-neutral-500">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-brand-400" /> 50 outfits / day
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-brand-400" /> 200 stylist chats / day
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-brand-400" /> Unlimited wardrobe
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-brand-400" /> Priority AI responses
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-brand-400" /> Style DNA card
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Ready to level up your style?
          </h2>
          <p className="text-neutral-400 mb-8 max-w-sm mx-auto">
            Take a 30-second quiz and get your first AI-curated outfit in minutes.
          </p>
          <Link href="/quiz">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-xl gradient-bg text-white font-semibold shadow-lg shadow-brand-400/20"
            >
              Get Started — Free
            </motion.button>
          </Link>
        </motion.div>

        {/* Footer */}
        <p className="text-xs text-neutral-600 mt-16">
          © 2026 OOTD AI. All rights reserved.
        </p>
      </section>
    </main>
  );
}
