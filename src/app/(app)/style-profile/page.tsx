"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

// Body shape options with descriptions
const BODY_SHAPES = [
  { value: "hourglass", label: "Hourglass", desc: "Balanced shoulders & hips, defined waist" },
  { value: "pear", label: "Pear", desc: "Narrower shoulders, wider hips" },
  { value: "apple", label: "Apple", desc: "Wider midsection, narrower hips" },
  { value: "rectangle", label: "Rectangle", desc: "Balanced proportions, straight silhouette" },
  { value: "inverted_triangle", label: "Inverted Triangle", desc: "Broader shoulders, narrower hips" },
  { value: "athletic", label: "Athletic", desc: "Muscular build, minimal curves" },
];

const HEIGHT_OPTIONS = [
  { value: "petite", label: "Petite", desc: "Under 5'3\" / 160cm" },
  { value: "average", label: "Average", desc: "5'3\" – 5'7\" / 160–170cm" },
  { value: "tall", label: "Tall", desc: "Over 5'7\" / 170cm" },
];

const FIT_OPTIONS = [
  { value: "fitted", label: "Fitted", desc: "Close to the body, shows shape" },
  { value: "relaxed", label: "Relaxed", desc: "Comfortable, not too tight or loose" },
  { value: "oversized", label: "Oversized", desc: "Loose, roomy, streetwear-influenced" },
];

const SKIN_DEPTH = [
  { value: "fair", label: "Fair" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "olive", label: "Olive" },
  { value: "tan", label: "Tan" },
  { value: "deep", label: "Deep" },
];

const UNDERTONES = [
  { value: "warm", label: "Warm", desc: "Veins look green, gold jewelry flatters" },
  { value: "cool", label: "Cool", desc: "Veins look purple/blue, silver flatters" },
  { value: "neutral", label: "Neutral", desc: "Both metals look equally good" },
];

const HAIR_COLORS = [
  { value: "black", label: "Black" },
  { value: "dark_brown", label: "Dark Brown" },
  { value: "medium_brown", label: "Medium Brown" },
  { value: "light_brown", label: "Light Brown" },
  { value: "dark_blonde", label: "Dark Blonde" },
  { value: "medium_blonde", label: "Medium Blonde" },
  { value: "light_blonde", label: "Light Blonde" },
  { value: "red", label: "Red" },
  { value: "auburn", label: "Auburn" },
  { value: "grey", label: "Grey" },
  { value: "white", label: "White" },
];

const EYE_COLORS = [
  { value: "brown", label: "Brown" },
  { value: "hazel", label: "Hazel" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "grey", label: "Grey" },
  { value: "amber", label: "Amber" },
  { value: "black", label: "Black" },
];

const BODY_AREAS = ["waist", "legs", "shoulders", "arms", "hips", "bust", "midsection"];

// Each step in the profile wizard
interface StepConfig {
  title: string;
  subtitle: string;
}

const STEPS: StepConfig[] = [
  { title: "Body Shape", subtitle: "Which describes you best?" },
  { title: "Height", subtitle: "Your general height range" },
  { title: "Fit Preference", subtitle: "How do you like your clothes to fit?" },
  { title: "Highlight & Minimize", subtitle: "Areas you want to play up or down" },
  { title: "Skin Tone", subtitle: "Your natural skin depth" },
  { title: "Undertone", subtitle: "Quick vein test — check your inner wrist" },
  { title: "Hair & Eyes", subtitle: "For your seasonal color palette" },
];

interface SeasonalAnalysis {
  season: string;
  label: string;
  description: string;
  bestColors: string[];
  worstColors: string[];
  bestMetals: string[];
  patternScale: string;
  intensity: string;
}

export default function StyleProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SeasonalAnalysis | null>(null);
  const [existingProfile, setExistingProfile] = useState(false);

  // Form state
  const [bodyShape, setBodyShape] = useState("");
  const [height, setHeight] = useState("");
  const [fitPreference, setFitPreference] = useState("");
  const [highlight, setHighlight] = useState<string[]>([]);
  const [minimize, setMinimize] = useState<string[]>([]);
  const [skinDepth, setSkinDepth] = useState("");
  const [undertone, setUndertone] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [eyeColor, setEyeColor] = useState("");

  // Load existing profile on mount
  useEffect(() => {
    fetch("/api/profile/styling")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile?.body) {
          setExistingProfile(true);
          setBodyShape(data.profile.body.shape || "");
          setHeight(data.profile.body.height || "");
          setFitPreference(data.profile.body.fitPreference || "");
          setHighlight(data.profile.body.highlight || []);
          setMinimize(data.profile.body.minimize || []);
        }
        if (data.profile?.color) {
          setSkinDepth(data.profile.color.skinDepth || "");
          setUndertone(data.profile.color.undertone || "");
          setHairColor(data.profile.color.hairColor || "");
          setEyeColor(data.profile.color.eyeColor || "");
        }
      })
      .catch(() => {});
  }, []);

  // Toggle area in highlight/minimize lists
  function toggleArea(area: string, list: string[], setList: (v: string[]) => void) {
    if (list.includes(area)) {
      setList(list.filter((a) => a !== area));
    } else if (list.length < 3) {
      setList([...list, area]);
    }
  }

  // Check if current step is complete
  function canProceed(): boolean {
    switch (step) {
      case 0: return !!bodyShape;
      case 1: return !!height;
      case 2: return !!fitPreference;
      case 3: return true; // highlight/minimize are optional
      case 4: return !!skinDepth;
      case 5: return !!undertone;
      case 6: return !!hairColor && !!eyeColor;
      default: return false;
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/styling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyShape, height, fitPreference, highlight, minimize,
          skinDepth, undertone, hairColor, eyeColor,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.seasonalAnalysis);
      }
    } catch {
      // Network error — show a basic result
    }
    setSaving(false);
  }

  // Results screen
  if (result) {
    return (
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Season card */}
          <div className="glass rounded-2xl p-6 text-center">
            <Sparkles className="mx-auto mb-3 text-brand-purple" size={28} />
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Your Color Season</p>
            <h2 className="font-heading text-3xl font-bold text-white mb-2">
              {result.label}
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm mx-auto">
              {result.description}
            </p>
          </div>

          {/* Best colors */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Your Best Colors</h3>
            <div className="flex flex-wrap gap-2">
              {result.bestColors.map((color) => (
                <span key={color} className="px-3 py-1.5 rounded-full bg-green-500/10 text-xs text-green-400 capitalize">
                  {color.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          {/* Colors to avoid */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Colors to Avoid</h3>
            <div className="flex flex-wrap gap-2">
              {result.worstColors.map((color) => (
                <span key={color} className="px-3 py-1.5 rounded-full bg-red-500/10 text-xs text-red-400 capitalize">
                  {color.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          {/* Metals + pattern */}
          <div className="glass rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Best Metals</p>
                <p className="text-sm text-neutral-300">{result.bestMetals.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Pattern Scale</p>
                <p className="text-sm text-neutral-300 capitalize">{result.patternScale}</p>
              </div>
            </div>
          </div>

          {/* Body shape summary */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Your Fit Profile</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Body Shape</span>
                <span className="text-neutral-200 capitalize">{bodyShape.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Height</span>
                <span className="text-neutral-200 capitalize">{height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Fit Preference</span>
                <span className="text-neutral-200 capitalize">{fitPreference}</span>
              </div>
              {highlight.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Highlight</span>
                  <span className="text-neutral-200 capitalize">{highlight.join(", ")}</span>
                </div>
              )}
              {minimize.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Minimize</span>
                  <span className="text-neutral-200 capitalize">{minimize.join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/profile")}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium text-neutral-300 transition hover:bg-white/10 cursor-pointer"
            >
              Back to Profile
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 rounded-xl gradient-bg px-4 py-3 text-sm font-semibold text-white cursor-pointer"
            >
              Get Outfits
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : router.back()}
          className="text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-heading text-xl font-bold text-white">
          {existingProfile ? "Update" : "Build"} Your Style Profile
        </h1>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-white/10 mb-8">
        <motion.div
          className="h-full rounded-full gradient-bg"
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-6"
        >
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">
              {STEPS[step].title}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">{STEPS[step].subtitle}</p>
          </div>

          {/* Step 0: Body Shape */}
          {step === 0 && (
            <div className="space-y-3">
              {BODY_SHAPES.map((shape) => (
                <button
                  key={shape.value}
                  onClick={() => setBodyShape(shape.value)}
                  className={`w-full text-left rounded-xl p-4 transition cursor-pointer ${
                    bodyShape === shape.value
                      ? "bg-brand-purple/20 border border-brand-purple/30"
                      : "glass hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="font-medium text-white text-sm">{shape.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{shape.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Height */}
          {step === 1 && (
            <div className="space-y-3">
              {HEIGHT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setHeight(opt.value)}
                  className={`w-full text-left rounded-xl p-4 transition cursor-pointer ${
                    height === opt.value
                      ? "bg-brand-purple/20 border border-brand-purple/30"
                      : "glass hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="font-medium text-white text-sm">{opt.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Fit Preference */}
          {step === 2 && (
            <div className="space-y-3">
              {FIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFitPreference(opt.value)}
                  className={`w-full text-left rounded-xl p-4 transition cursor-pointer ${
                    fitPreference === opt.value
                      ? "bg-brand-purple/20 border border-brand-purple/30"
                      : "glass hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="font-medium text-white text-sm">{opt.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Highlight & Minimize */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-white font-medium mb-2">
                  Highlight <span className="text-neutral-500">(up to 3)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {BODY_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleArea(area, highlight, setHighlight)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition cursor-pointer ${
                        highlight.includes(area)
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "glass text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-white font-medium mb-2">
                  Minimize <span className="text-neutral-500">(up to 3)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {BODY_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleArea(area, minimize, setMinimize)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition cursor-pointer ${
                        minimize.includes(area)
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "glass text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Skin Depth */}
          {step === 4 && (
            <div className="grid grid-cols-3 gap-3">
              {SKIN_DEPTH.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSkinDepth(opt.value)}
                  className={`rounded-xl p-4 text-center transition cursor-pointer ${
                    skinDepth === opt.value
                      ? "bg-brand-purple/20 border border-brand-purple/30"
                      : "glass hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="font-medium text-white text-sm">{opt.label}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 5: Undertone */}
          {step === 5 && (
            <div className="space-y-3">
              {UNDERTONES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setUndertone(opt.value)}
                  className={`w-full text-left rounded-xl p-4 transition cursor-pointer ${
                    undertone === opt.value
                      ? "bg-brand-purple/20 border border-brand-purple/30"
                      : "glass hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="font-medium text-white text-sm">{opt.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 6: Hair & Eye Color */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-white font-medium mb-2">Hair Color</p>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setHairColor(opt.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        hairColor === opt.value
                          ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                          : "glass text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-white font-medium mb-2">Eye Color</p>
                <div className="flex flex-wrap gap-2">
                  {EYE_COLORS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEyeColor(opt.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                        eyeColor === opt.value
                          ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                          : "glass text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-medium text-neutral-300 transition hover:bg-white/10 cursor-pointer"
          >
            Back
          </button>
        )}
        <button
          onClick={() => {
            if (step < STEPS.length - 1) {
              setStep(step + 1);
            } else {
              handleSave();
            }
          }}
          disabled={!canProceed() || saving}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl gradient-bg px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              Analyzing...
            </>
          ) : step < STEPS.length - 1 ? (
            <>
              Next
              <ArrowRight size={16} />
            </>
          ) : (
            <>
              <Check size={16} />
              Get My Color Season
            </>
          )}
        </button>
      </div>
    </main>
  );
}
