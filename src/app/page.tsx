"use client";

// ── OOTD AI — $10K Premium Landing Page ──
// Editorial fashion magazine aesthetic with real photography, interactive components,
// phone mockup, outfit gallery, and MagicUI premium effects
// Components: Particles (hero bg), BorderBeam (cards), BlurFade (reveals)
// Visuals: Unsplash editorial fashion photography, CSS phone mockup, genre color system

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  Shirt,
  Camera,
  ShoppingBag,
  Sparkles,
  Zap,
  Palette,
  ArrowRight,
  MessageCircle,
  TrendingUp,
  Users,
  Star,
  ChevronRight,
  Flame,
  Heart,
} from "lucide-react";
import { Particles } from "@/components/ui/particles";
import { BorderBeam } from "@/components/ui/border-beam";

// ── 12 style genres with brand colors, descriptions, and curated Unsplash photos ──
// Each photo hand-picked from Unsplash search results to truly represent each genre's aesthetic
// All copyright-free (Unsplash license — free for commercial use, no attribution required)
const GENRES = [
  // White suit + hat — quiet luxury, no logos, heritage silhouette
  { name: "Old Money", color: "#C9B99A", desc: "Quiet luxury, heritage fabrics", img: "https://images.unsplash.com/photo-1691154928997-5d839847e4e7?w=500&h=700&fit=crop&q=80" },
  // Ed Hardy jeans + colorful handbag — quintessential early-2000s branding
  { name: "Y2K", color: "#FF69B4", desc: "Bold prints, butterfly clips", img: "https://images.unsplash.com/photo-1760724850043-43eefff20a2a?w=500&h=700&fit=crop&q=80" },
  // Red/white jacket + Jordan 1s on concrete stairs — bold, fire streetwear
  { name: "Streetwear", color: "#FF4500", desc: "Oversized, sneaker culture", img: "https://images.unsplash.com/photo-1628030328071-538b251a4455?w=500&h=700&fit=crop&q=80" },
  // Black blazer near textured brick wall — editorial minimalist, chic silhouette
  { name: "Minimalist", color: "#A0A0A0", desc: "Clean lines, neutral palette", img: "https://images.unsplash.com/photo-1759873911575-0e4eec0c246c?w=500&h=700&fit=crop&q=80" },
  // Vintage dress in field of flowers — pastoral, soft, romantic countryside
  { name: "Cottagecore", color: "#8FBC8F", desc: "Florals, soft textures", img: "https://images.unsplash.com/photo-1775527667042-0a5f69cbc07b?w=500&h=700&fit=crop&q=80" },
  // Gray turtleneck under blazer — scholarly, layered, earth-toned
  { name: "Dark Academia", color: "#8B4513", desc: "Tweed, turtlenecks, earth tones", img: "https://images.unsplash.com/photo-1615349719958-8e6381dd2f3e?w=500&h=700&fit=crop&q=80" },
  // White flowing dress + wide-brim hat on Greek beach — relaxed coastal luxury
  { name: "Coastal", color: "#87CEEB", desc: "Linen, blue tones, relaxed", img: "https://images.unsplash.com/photo-1622914823333-a05e6e00606d?w=500&h=700&fit=crop&q=80" },
  // Dark coat, moody urban setting — distressed, layered, raw
  { name: "Grunge", color: "#696969", desc: "Flannel, distressed, layered", img: "https://images.unsplash.com/photo-1523297467724-f6758d7124c5?w=500&h=700&fit=crop&q=80" },
  // Pink fur coat + sunglasses — feminine maximalism, soft and bold
  { name: "Coquette", color: "#FFB6C1", desc: "Bows, pastels, feminine", img: "https://images.unsplash.com/photo-1609534927279-5d8c599f3ea6?w=500&h=700&fit=crop&q=80" },
  // Red technical jacket in misty forest — full outdoor gear, trail-ready
  { name: "Gorpcore", color: "#556B2F", desc: "Technical outdoor wear", img: "https://images.unsplash.com/photo-1779291681256-43a4e5d79a9f?w=500&h=700&fit=crop&q=80" },
  // Golden hour portrait, gold earrings, warm neutral tones — effortless polish
  { name: "Clean Girl", color: "#D4A574", desc: "Slicked hair, gold hoops", img: "https://images.unsplash.com/photo-1665520674561-2c5edb9b5435?w=500&h=700&fit=crop&q=80" },
  // Fringe skirt + fur hat in forest — layered bohemian, free-spirited
  { name: "Indie Boho", color: "#CD853F", desc: "Free-spirited, vintage finds", img: "https://images.unsplash.com/photo-1762627644361-58dc6e3e4cf2?w=500&h=700&fit=crop&q=80" },
];

// ── Editorial fashion photography from Unsplash ──
// High-quality, editorially curated fashion photos for premium visual impact
const PHOTOS = {
  // Hero — dramatic editorial: bomber jacket + dark dress, moody urban lighting
  hero: "https://images.unsplash.com/photo-1779911915389-914430fad5e6?w=1400&h=900&fit=crop&q=85",
  // Outfit gallery — different photos from the genre cards to show variety
  gallery: [
    {
      src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop&q=80",
      genre: "Streetwear",
      color: "#FF4500",
    },
    {
      src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop&q=80",
      genre: "Minimalist",
      color: "#A0A0A0",
    },
    {
      src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=800&fit=crop&q=80",
      genre: "Y2K",
      color: "#FF69B4",
    },
    {
      src: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&h=800&fit=crop&q=80",
      genre: "Old Money",
      color: "#C9B99A",
    },
    {
      src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&fit=crop&q=80",
      genre: "Clean Girl",
      color: "#D4A574",
    },
    {
      src: "https://images.unsplash.com/photo-1523297467724-f6758d7124c5?w=600&h=800&fit=crop&q=80",
      genre: "Grunge",
      color: "#696969",
    },
  ],
  // Feature section backgrounds
  wardrobe: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=600&fit=crop&q=80",
  stylist: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop&q=80",
};

// ── Feature cards for bento grid ──
const FEATURES = [
  {
    icon: Shirt,
    title: "Smart Wardrobe",
    description: "Upload a photo. AI categorizes it, removes the background, and files it in your digital closet.",
    accent: "#C084FC",
    large: true,
  },
  {
    icon: Camera,
    title: "Rate My Outfit",
    description: "Snap a photo, get an honest rating with styling alternatives.",
    accent: "#FF6B9D",
  },
  {
    icon: MessageCircle,
    title: "Personal Stylist",
    description: "Chat with AI that understands your taste. Specific, honest advice.",
    accent: "#60A5FA",
  },
  {
    icon: ShoppingBag,
    title: "Shop the Gap",
    description: "AI spots what is missing. Every recommendation links to the store.",
    accent: "#22C55E",
  },
  {
    icon: TrendingUp,
    title: "Style Evolution",
    description: "Track how your taste changes over time. Your fashion journey, visualized.",
    accent: "#F59E0B",
  },
  {
    icon: Users,
    title: "Community Feed",
    description: "Share outfits, follow tastemakers, discover looks from every genre.",
    accent: "#EC4899",
  },
];

// ── BlurFade entrance animation — blur + fade + slide ──
function BlurFade({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  offset = 8,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ y: offset, opacity: 0, filter: "blur(8px)" }}
      animate={
        inView
          ? { y: 0, opacity: 1, filter: "blur(0px)" }
          : { y: offset, opacity: 0, filter: "blur(8px)" }
      }
      transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Shiny text sweep effect for badges ──
function ShinyText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-[length:200px_100%] bg-clip-text bg-no-repeat text-neutral-400/70 animate-[shiny-text_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/80 via-50% to-transparent ${className}`}
    >
      {children}
    </span>
  );
}

// ── Phone mockup — CSS-only realistic device frame ──
// Shows the app dashboard UI in a floating angled presentation
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] md:w-[300px]">
      {/* Phone frame */}
      <div className="relative rounded-[40px] border-[8px] border-neutral-800 bg-[#0F0B15] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Notch / dynamic island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[24px] bg-neutral-800 rounded-b-2xl z-20" />

        {/* Screen content — miniature dashboard */}
        <div className="relative aspect-[9/19.5] overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-8 pb-2">
            <span className="text-[8px] text-white/60 font-medium">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-1.5 rounded-sm bg-white/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>

          {/* Dashboard header */}
          <div className="px-4 pt-2 pb-3">
            <p className="text-[10px] font-bold text-white">Your Outfits</p>
            <p className="text-[7px] text-neutral-500 mt-0.5">Swipe through AI-curated looks</p>
          </div>

          {/* Genre pills row */}
          <div className="flex gap-1.5 px-4 pb-3 overflow-hidden">
            {["Old Money", "Y2K", "Street"].map((g, i) => (
              <span
                key={g}
                className={`text-[7px] px-2 py-0.5 rounded-full shrink-0 ${
                  i === 0
                    ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                    : "bg-white/5 text-neutral-500"
                }`}
              >
                {g}
              </span>
            ))}
          </div>

          {/* Outfit card preview */}
          <div className="mx-3 rounded-xl overflow-hidden border border-white/5">
            <div className="relative aspect-[3/4] bg-gradient-to-br from-neutral-800 to-neutral-900">
              {/* Mini outfit image */}
              <Image
                src={PHOTOS.gallery[0].src}
                alt="Outfit preview"
                fill
                className="object-cover opacity-90"
                sizes="300px"
              />
              {/* Genre tag overlay */}
              <div className="absolute top-2 left-2">
                <span className="text-[6px] px-1.5 py-0.5 rounded-full bg-black/50 text-white/80 backdrop-blur-sm">
                  Streetwear
                </span>
              </div>
            </div>

            {/* Card actions */}
            <div className="flex items-center justify-between p-2 bg-white/[0.02]">
              <div className="flex gap-2">
                <Heart size={10} className="text-neutral-500" />
                <span className="text-[7px] text-neutral-500">Save</span>
              </div>
              <div className="flex gap-1">
                <span className="text-[7px] text-neutral-400">Swipe</span>
                <ChevronRight size={8} className="text-neutral-500" />
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-3 border-t border-white/5 bg-[#0F0B15]/90 backdrop-blur-sm">
            {[Sparkles, Shirt, Camera, Users].map((Icon, i) => (
              <Icon
                key={i}
                size={14}
                className={i === 0 ? "text-brand-purple" : "text-neutral-600"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Reflection glow beneath phone */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[200px] h-[40px] bg-brand-purple/10 rounded-full blur-2xl" />
    </div>
  );
}

export default function LandingPage() {
  // ── Hero parallax tracking ──
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // ── Genre hover for interactive showcase ──
  const [hoveredGenre, setHoveredGenre] = useState<number | null>(null);

  return (
    <main className="overflow-x-hidden">
      {/* ── NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 backdrop-blur-xl bg-brand-dark/70 border-b border-white/5">
        <Link href="/" className="font-heading text-xl font-bold text-white tracking-[-0.03em]">
          OOTD
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors hidden sm:block">
            Sign in
          </Link>
          <Link
            href="/quiz"
            className="text-sm font-medium text-[#0F0B15] bg-white px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── HERO — Split layout with editorial photography ──
          Left: bold serif headline + CTA
          Right: editorial fashion photo with gradient overlay
          Particles layer over everything for depth */}
      <section
        ref={heroRef}
        className="relative min-h-[100dvh] grid grid-cols-1 md:grid-cols-2 overflow-hidden"
      >
        {/* Particle field — mouse-reactive floating dots, hot pink for Y2K energy */}
        <Particles
          className="absolute inset-0 z-10"
          quantity={70}
          staticity={30}
          ease={80}
          size={0.5}
          color="#FF69B4"
        />

        {/* Left column — headline and CTA */}
        <div className="relative z-20 flex flex-col justify-end px-6 md:px-16 pb-16 md:pb-24 pt-28">
          {/* Badge */}
          <BlurFade delay={0.1}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-8 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <ShinyText className="text-xs tracking-wide">
                Style DNA + Community Feed live
              </ShinyText>
            </div>
          </BlurFade>

          {/* Headline — oversized italic Playfair with attitude */}
          <BlurFade delay={0.2} offset={16}>
            <h1 className="font-heading text-[clamp(3rem,7vw,6.5rem)] font-bold italic text-white leading-[0.92] tracking-[-0.03em]">
              Your fit,<br />figured out.
            </h1>
          </BlurFade>

          {/* Sub-copy — streetwear energy */}
          <BlurFade delay={0.35}>
            <p className="text-neutral-400 mt-6 text-lg md:text-xl leading-relaxed max-w-md">
              AI that knows your drip. 12 style genres from Y2K to old money. Built from your actual wardrobe.
            </p>
          </BlurFade>

          {/* CTAs */}
          <BlurFade delay={0.45}>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#0F0B15] font-medium text-sm tracking-wide rounded-full hover:bg-neutral-200 transition-colors"
              >
                Take the style quiz
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-white/15 text-neutral-300 font-medium text-sm rounded-full hover:bg-white/5 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </BlurFade>
        </div>

        {/* Right column — editorial fashion photo */}
        <div className="relative hidden md:block">
          {/* Full-bleed photo with gradient overlay */}
          <Image
            src={PHOTOS.hero}
            alt="Fashion editorial"
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />
          {/* Left-edge gradient fade into dark background */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/40 to-transparent" />
          {/* Bottom gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 to-transparent" />
        </div>

        {/* Mobile — show photo as background behind text */}
        <div className="absolute inset-0 md:hidden">
          <Image
            src={PHOTOS.hero}
            alt="Fashion editorial"
            fill
            className="object-cover opacity-20"
            sizes="100vw"
            priority
          />
        </div>
      </section>

      {/* ── MARQUEE — Fashion keywords strip ──
          Single infinite scroll of fashion terms (max 1 marquee per page)
          Creates visual motion between sections */}
      <section className="border-y border-white/5 py-5 overflow-hidden">
        <div className="flex animate-[marquee_30s_linear_infinite]">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex shrink-0">
              {[
                "STREETWEAR", "Y2K", "OLD MONEY", "GRUNGE", "12 GENRES",
                "AI STYLIST", "OUTFIT", "COQUETTE", "GORPCORE", "CLEAN GIRL",
                "DARK ACADEMIA", "COTTAGECORE",
              ].map((word, i) => (
                <span
                  key={`${setIdx}-${i}`}
                  className="text-xs text-neutral-500/60 uppercase tracking-[0.3em] px-8 shrink-0 font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── EDITORIAL STATEMENT ──
          Pull-quote summarizing the product */}
      <section className="px-6 md:px-16 py-24 md:py-32">
        <BlurFade>
          <p className="font-heading text-[clamp(1.4rem,3.5vw,2.8rem)] text-center text-white/90 leading-snug max-w-4xl mx-auto tracking-[-0.01em]">
            Upload your wardrobe. AI learns your taste.
            <br className="hidden md:block" />
            Wake up to outfits that hit different.
          </p>
        </BlurFade>
      </section>

      {/* ── HOW IT WORKS — Visual step-by-step ──
          Three steps with accent icons, separated by vertical rules on desktop */}
      <section className="px-6 md:px-16 py-20 border-t border-white/5">
        <BlurFade>
          <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] text-center mb-16">
            How it works
          </p>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 max-w-5xl mx-auto">
          {[
            { icon: Palette, title: "Take the quiz", desc: "30 seconds. We map your taste across all 12 genres." },
            { icon: Sparkles, title: "Get outfits", desc: "AI generates complete looks matched to your body, weather, and wardrobe." },
            { icon: Zap, title: "Wear or shop", desc: "Wear what you own or tap to buy what is missing. One-tap shopping links." },
          ].map((step, i) => (
            <BlurFade key={step.title} delay={i * 0.1}>
              <div className={`text-center px-6 md:px-10 ${i < 2 ? "md:border-r md:border-white/5" : ""}`}>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-purple/[0.08] border border-brand-purple/10 mb-5">
                  <step.icon size={24} className="text-brand-purple" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── FEATURE BENTO GRID ──
          Asymmetric layout: hero card with photo + 5 smaller cards
          BorderBeam on the main card, hover glow effects
          Real wardrobe photo as background in the hero card */}
      <section className="px-6 md:px-16 py-28 md:py-36 border-t border-white/5">
        <BlurFade>
          <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] text-center mb-4">
            Features
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-16 tracking-[-0.02em]">
            Everything you need to dress better
          </h2>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {FEATURES.map((feature, i) => (
            <BlurFade key={feature.title} delay={i * 0.05}>
              <div
                className={`relative group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1] ${
                  feature.large ? "md:col-span-2 md:row-span-2 min-h-[200px] md:min-h-[400px]" : "min-h-[180px]"
                }`}
              >
                {/* Photo background for hero card */}
                {feature.large && (
                  <>
                    <Image
                      src={PHOTOS.wardrobe}
                      alt="Wardrobe"
                      fill
                      className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0B15] via-[#0F0B15]/80 to-transparent" />
                    <BorderBeam size={120} duration={8} colorFrom="#C084FC" colorTo="#FF6B9D" borderWidth={1} />
                  </>
                )}

                {/* Card content */}
                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-end">
                  <div
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${feature.accent}15` }}
                  >
                    <feature.icon size={20} style={{ color: feature.accent }} />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>
                </div>

                {/* Hover corner glow */}
                <div
                  className="absolute -bottom-4 -right-4 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
                  style={{ backgroundColor: `${feature.accent}08` }}
                />
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── OUTFIT GALLERY — Magazine-style editorial grid ──
          Masonry-inspired layout with real fashion photography
          Each photo has a genre label overlay
          The visual centerpiece of the page */}
      <section className="px-6 md:px-16 py-28 md:py-36 border-t border-white/5">
        <BlurFade>
          <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] text-center mb-4">
            Outfit inspiration
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-16 tracking-[-0.02em]">
            Styled by AI, worn by you
          </h2>
        </BlurFade>

        {/* Editorial photo grid — asymmetric magazine layout */}
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {PHOTOS.gallery.map((photo, i) => (
            <BlurFade key={i} delay={i * 0.06}>
              <div
                className={`relative group overflow-hidden rounded-xl ${
                  i === 0 ? "row-span-2" : ""
                }`}
              >
                <div className={`relative ${i === 0 ? "aspect-[3/5]" : "aspect-[3/4]"}`}>
                  <Image
                    src={photo.src}
                    alt={`${photo.genre} outfit`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Genre label */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: photo.color }}
                    />
                    <span className="text-xs font-medium text-white/90">{photo.genre}</span>
                  </div>

                  {/* Hover save button */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Heart size={14} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>

        {/* CTA below gallery */}
        <BlurFade delay={0.3}>
          <div className="text-center mt-12">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors group"
            >
              Get outfits curated for your style
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </BlurFade>
      </section>

      {/* ── APP PREVIEW — Phone mockup + description ──
          Shows the real app UI in a floating phone frame
          Split layout: description left, phone right */}
      <section className="px-6 md:px-16 py-28 md:py-36 border-t border-white/5 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left — description */}
          <div>
            <BlurFade>
              <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] mb-4">
                The app
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6 tracking-[-0.02em]">
                Your personal stylist, in your pocket
              </h2>
            </BlurFade>
            <BlurFade delay={0.1}>
              <p className="text-neutral-400 leading-relaxed mb-8">
                Swipe through AI-curated outfits. Upload your wardrobe. Chat with your stylist. Track your style evolution. Everything adapts to your taste, body, and local weather.
              </p>
            </BlurFade>

            {/* Feature list with icons */}
            <div className="space-y-4">
              {[
                { icon: Sparkles, text: "AI generates outfits from your clothes" },
                { icon: Flame, text: "Daily streaks and style challenges" },
                { icon: TrendingUp, text: "Your taste profile evolves over time" },
                { icon: ShoppingBag, text: "One-tap shopping for missing pieces" },
              ].map((item, i) => (
                <BlurFade key={i} delay={0.15 + i * 0.05}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-purple/[0.08] flex items-center justify-center shrink-0">
                      <item.icon size={16} className="text-brand-purple" />
                    </div>
                    <span className="text-sm text-neutral-300">{item.text}</span>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>

          {/* Right — phone mockup */}
          <BlurFade delay={0.2}>
            <div className="flex justify-center">
              <motion.div
                initial={{ rotateY: -5, rotateX: 2 }}
                whileInView={{ rotateY: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ perspective: 1000 }}
              >
                <PhoneMockup />
              </motion.div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ── GENRE SHOWCASE — Visual card grid with outfit photos ──
          Each genre gets a photo card with color-accented overlay
          Hover reveals description + glow in genre color
          4-column grid on desktop, 2 on mobile */}
      <section className="px-6 md:px-16 py-28 md:py-36 border-t border-white/5">
        <BlurFade>
          <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] text-center mb-4">
            12 Style Genres
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-4 tracking-[-0.02em]">
            Every aesthetic. One app.
          </h2>
          <p className="text-neutral-500 text-center text-sm mb-16 max-w-lg mx-auto">
            From quiet luxury to full Y2K chaos. Pick your vibe, mix your genres, own your look.
          </p>
        </BlurFade>

        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {GENRES.map((genre, i) => (
            <BlurFade key={genre.name} delay={i * 0.04}>
              <div
                onMouseEnter={() => setHoveredGenre(i)}
                onMouseLeave={() => setHoveredGenre(null)}
                className="relative group rounded-xl overflow-hidden cursor-pointer"
              >
                {/* Genre outfit photo */}
                <div className="relative aspect-[3/4]">
                  <Image
                    src={genre.img}
                    alt={`${genre.name} style`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />

                  {/* Dark gradient overlay — stronger on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300" />

                  {/* Genre color glow on hover — appears at the bottom */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(to top, ${genre.color}30, transparent 60%)`,
                    }}
                  />

                  {/* Top-left color accent bar */}
                  <div
                    className="absolute top-0 left-0 w-8 h-1 rounded-br-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: genre.color }}
                  />

                  {/* Genre name + description overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 transition-shadow duration-300"
                        style={{
                          backgroundColor: genre.color,
                          boxShadow: hoveredGenre === i ? `0 0 8px ${genre.color}80` : "none",
                        }}
                      />
                      <span className="font-heading text-sm md:text-base font-semibold text-white tracking-tight">
                        {genre.name}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-xs text-white/50 group-hover:text-white/70 transition-colors leading-snug">
                      {genre.desc}
                    </p>
                  </div>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF — Editorial pull-quotes ──
          Italic serif quotes, minimal attribution, star accents */}
      <section className="px-6 md:px-16 py-28 md:py-36 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          {[
            {
              quote: "Finally an app that gets my aesthetic without me explaining it 50 times.",
              name: "Sarah K.",
              genre: "Old Money",
            },
            {
              quote: "The wardrobe gap analysis saved me from buying another black top I didn’t need.",
              name: "Mia L.",
              genre: "Minimalist",
            },
          ].map((t, i) => (
            <BlurFade key={i} delay={i * 0.1}>
              <div>
                <Star size={16} className="text-brand-purple/40 mb-4" />
                <p className="text-lg md:text-xl text-white/80 leading-relaxed font-heading italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-sm text-neutral-500 mt-4">
                  {t.name} &middot; {t.genre}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── PRICING — Premium cards ──
          Free and Pro side by side
          Pro card has border-beam emphasis */}
      <section className="px-6 md:px-16 py-28 md:py-36 border-t border-white/5">
        <BlurFade>
          <p className="text-xs text-neutral-500 uppercase tracking-[0.2em] text-center mb-4">
            Pricing
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white text-center mb-16 tracking-[-0.02em]">
            Start free, go Pro
          </h2>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <BlurFade>
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 h-full flex flex-col">
              <p className="text-sm text-neutral-500 uppercase tracking-wider mb-2">Free</p>
              <p className="font-heading text-4xl font-bold text-white mb-6">$0</p>
              <div className="space-y-3 text-sm text-neutral-400 flex-1">
                <p className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-neutral-600" />3 outfits per day</p>
                <p className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-neutral-600" />5 stylist chats per day</p>
                <p className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-neutral-600" />20 wardrobe uploads</p>
                <p className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-neutral-600" />All 12 genres</p>
              </div>
              <Link
                href="/signup"
                className="mt-8 w-full inline-flex items-center justify-center py-3 border border-white/10 text-white text-sm font-medium rounded-full hover:bg-white/5 transition-colors"
              >
                Get started free
              </Link>
            </div>
          </BlurFade>

          {/* Pro */}
          <BlurFade delay={0.1}>
            <div className="relative rounded-2xl border border-brand-purple/20 bg-white/[0.02] p-8 h-full flex flex-col overflow-hidden">
              <BorderBeam size={100} duration={10} colorFrom="#C084FC" colorTo="#60A5FA" borderWidth={1} />
              <p className="text-sm text-brand-purple uppercase tracking-wider mb-2">Pro</p>
              <div className="flex items-baseline gap-1 mb-6">
                <p className="font-heading text-4xl font-bold text-white">$24.99</p>
                <span className="text-sm text-neutral-500">/month</span>
              </div>
              <div className="space-y-3 text-sm text-neutral-300 flex-1">
                <p className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-brand-purple" />50 outfits per day</p>
                <p className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-brand-purple" />200 stylist chats per day</p>
                <p className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-brand-purple" />Unlimited wardrobe</p>
                <p className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-brand-purple" />Priority responses</p>
                <p className="flex items-center gap-3"><span className="w-1 h-1 rounded-full bg-brand-purple" />Style DNA card</p>
              </div>
              <Link
                href="/signup"
                className="mt-8 w-full inline-flex items-center justify-center py-3 bg-white text-[#0F0B15] text-sm font-medium rounded-full hover:bg-neutral-200 transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ── FINAL CTA — Bold closing with particles ── */}
      <section className="relative px-6 md:px-16 py-32 md:py-44 border-t border-white/5 text-center overflow-hidden">
        <Particles
          className="absolute inset-0"
          quantity={40}
          staticity={40}
          ease={100}
          size={0.3}
          color="#C084FC"
        />
        <div className="relative z-10">
          <BlurFade>
            <h2 className="font-heading text-[clamp(2rem,5vw,4.5rem)] font-bold italic text-white tracking-[-0.02em] mb-6">
              Stop overthinking your fits.
            </h2>
          </BlurFade>
          <BlurFade delay={0.1}>
            <p className="text-neutral-400 mb-10 max-w-md mx-auto">
              30-second quiz. First outfit in minutes. No more mirror panic.
            </p>
          </BlurFade>
          <BlurFade delay={0.2}>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-[#0F0B15] font-medium text-sm tracking-wide rounded-full hover:bg-neutral-200 transition-colors"
            >
              Take the style quiz
              <ArrowRight size={16} />
            </Link>
          </BlurFade>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 px-6 md:px-16 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-heading text-lg font-bold text-white tracking-[-0.03em]">
              OOTD
            </Link>
            <div className="flex gap-6 text-sm text-neutral-500">
              <Link href="/quiz" className="hover:text-white transition-colors">Quiz</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
            </div>
          </div>
          <p className="text-xs text-neutral-600">&copy; 2026 OOTD AI. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
