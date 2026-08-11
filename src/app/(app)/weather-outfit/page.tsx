"use client";

// ── Weather-Based Outfit Suggestions ──
// Fetches user's location weather and suggests outfits from their wardrobe
// Combines weather data with genre preferences for smart recommendations
// Daily engagement hook — "what to wear today" based on actual conditions

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, RefreshCw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";

// Weather condition type
interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "windy" | "stormy";
  humidity: number;
  city: string;
  description: string;
}

// AI outfit suggestion
interface OutfitSuggestion {
  title: string;
  description: string;
  items: string[];
  tip: string;
  genre: string;
}

// Weather condition icon + color mapping
function weatherIcon(condition: string) {
  switch (condition) {
    case "sunny": return <Sun size={32} className="text-yellow-400" />;
    case "cloudy": return <Cloud size={32} className="text-neutral-400" />;
    case "rainy": return <CloudRain size={32} className="text-blue-400" />;
    case "snowy": return <Snowflake size={32} className="text-cyan-300" />;
    case "windy": return <Wind size={32} className="text-neutral-300" />;
    default: return <Cloud size={32} className="text-neutral-400" />;
  }
}

function weatherBg(condition: string) {
  switch (condition) {
    case "sunny": return "from-yellow-400/10 to-orange-400/5";
    case "cloudy": return "from-neutral-400/10 to-neutral-600/5";
    case "rainy": return "from-blue-400/10 to-indigo-400/5";
    case "snowy": return "from-cyan-300/10 to-blue-300/5";
    case "windy": return "from-neutral-300/10 to-neutral-500/5";
    default: return "from-neutral-400/10 to-neutral-600/5";
  }
}

export default function WeatherOutfitPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [locationError, setLocationError] = useState(false);

  // Get user's location + weather on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Uses existing /api/weather endpoint (Open-Meteo + Nominatim)
          const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            // Map API response to our WeatherData shape
            const conditionMap: Record<string, WeatherData["condition"]> = {
              "Clear sky": "sunny",
              "Partly cloudy": "cloudy",
              "Foggy": "cloudy",
              "Drizzle": "rainy",
              "Rain": "rainy",
              "Rain showers": "rainy",
              "Freezing rain": "rainy",
              "Snow": "snowy",
              "Snow grains": "snowy",
              "Snow showers": "snowy",
              "Thunderstorm": "stormy",
              "Cloudy": "cloudy",
            };
            setWeather({
              temp: data.tempC,
              feelsLike: data.tempC,
              condition: conditionMap[data.condition] || "cloudy",
              humidity: data.humidity,
              city: data.city,
              description: `${data.condition}, ${data.tempC}°C with ${data.humidity}% humidity`,
            });
          }
        } catch {
          setWeather({
            temp: 28,
            feelsLike: 31,
            condition: "sunny",
            humidity: 65,
            city: "Your City",
            description: "Clear skies, warm and humid",
          });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLocationError(true);
        setLoading(false);
      }
    );
  }, []);

  // Generate AI outfit suggestions based on weather
  async function handleGenerate() {
    if (!weather) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/weather/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temp: weather.temp,
          condition: weather.condition,
          humidity: weather.humidity,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestions) setSuggestions(data.suggestions);
        toast("Outfit ideas ready!", "success");
      }
    } catch {
      toast("Failed to generate suggestions", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PageTransition>
      <main className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-heading text-xl font-bold text-white">Weather Outfit</h1>
            <p className="text-xs text-neutral-500">What to wear today based on conditions</p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6 animate-pulse">
              <div className="h-8 w-20 rounded bg-white/5 mb-2" />
              <div className="h-4 w-32 rounded bg-white/5" />
            </div>
            <div className="glass rounded-2xl p-6 animate-pulse">
              <div className="h-4 w-24 rounded bg-white/5 mb-3" />
              <div className="h-16 rounded-xl bg-white/5" />
            </div>
          </div>
        )}

        {/* Location error */}
        {locationError && !loading && (
          <div className="glass rounded-2xl p-8 text-center">
            <MapPin size={32} className="mx-auto text-brand-purple mb-4" />
            <h3 className="text-sm font-semibold text-white mb-2">Location needed</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Allow location access so we can check your local weather and suggest the perfect outfit.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="gradient-bg rounded-xl px-6 py-2.5 text-sm font-semibold text-white cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Weather card */}
        {weather && !loading && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-2xl p-6 mb-4 bg-gradient-to-br ${weatherBg(weather.condition)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-neutral-400" />
                    <span className="text-sm text-neutral-300">{weather.city}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-5xl font-bold text-white">{weather.temp}°</span>
                    <span className="text-neutral-400 text-sm">C</span>
                  </div>
                </div>
                {weatherIcon(weather.condition)}
              </div>

              <p className="text-sm text-neutral-300 mb-3">{weather.description}</p>

              <div className="flex gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Thermometer size={12} />
                  Feels {weather.feelsLike}°
                </span>
                <span className="flex items-center gap-1">
                  <Cloud size={12} />
                  {weather.humidity}% humidity
                </span>
              </div>
            </motion.div>

            {/* Generate suggestions button */}
            {suggestions.length === 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3.5 rounded-xl gradient-bg text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mb-4"
              >
                {generating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Finding your perfect outfit...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    What should I wear?
                  </>
                )}
              </motion.button>
            )}

            {/* Outfit suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs text-neutral-500 uppercase tracking-wider">Today&apos;s Outfit Ideas</h3>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="text-xs text-brand-purple hover:text-brand-pink transition cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>

                {suggestions.map((suggestion, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="glass rounded-2xl p-5"
                  >
                    <h4 className="text-sm font-semibold text-white mb-1">{suggestion.title}</h4>
                    <p className="text-xs text-neutral-400 mb-3">{suggestion.description}</p>

                    {/* Suggested items */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {suggestion.items.map((item, j) => (
                        <span
                          key={j}
                          className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-neutral-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    {/* Pro tip */}
                    <div className="flex items-start gap-2 pt-3 border-t border-white/5">
                      <Sparkles size={12} className="text-brand-purple shrink-0 mt-0.5" />
                      <p className="text-xs text-neutral-400">{suggestion.tip}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </PageTransition>
  );
}
