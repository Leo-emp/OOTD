"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  tempC: number;
  tempF: number;
  condition: string;
  city: string;
  outfitWeather: "hot" | "warm" | "cool" | "cold";
}

// Fetches weather based on browser geolocation
// Caches in sessionStorage to avoid repeated API calls + geolocation prompts
export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage first
    try {
      const cached = sessionStorage.getItem("ootd-weather");
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use if less than 30 min old
        if (Date.now() - parsed.timestamp < 1800000) {
          setWeather(parsed.data);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // Request geolocation
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data: WeatherData = await res.json();
            setWeather(data);
            // Cache in sessionStorage
            try {
              sessionStorage.setItem("ootd-weather", JSON.stringify({
                data,
                timestamp: Date.now(),
              }));
            } catch {}
          }
        } catch {}
        setLoading(false);
      },
      () => {
        // User denied geolocation or error — that's fine, just skip
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 1800000 },
    );
  }, []);

  return { weather, loading };
}
