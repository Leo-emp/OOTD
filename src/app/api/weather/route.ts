// GET /api/weather?lat=13.75&lon=100.52
// Proxies to Open-Meteo (free, no API key) + Nominatim for city name
// Returns: temperature, condition, city, and our outfit weather category

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// Map temperature ranges to outfit weather categories
function tempToCategory(tempC: number): "hot" | "warm" | "cool" | "cold" {
  if (tempC >= 30) return "hot";
  if (tempC >= 20) return "warm";
  if (tempC >= 10) return "cool";
  return "cold";
}

// Map WMO weather codes to human-readable conditions
function weatherCodeToCondition(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 55) return "Drizzle";
  if (code <= 65) return "Rain";
  if (code <= 67) return "Freezing rain";
  if (code <= 75) return "Snow";
  if (code <= 77) return "Snow grains";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const { lat, lon } = parsed.data;

  try {
    // Fetch weather + city name in parallel
    const [weatherRes, geoRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m`,
        { next: { revalidate: 1800 } }, // cache 30 min
      ),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
        {
          headers: { "User-Agent": "OOTD-AI/1.0" },
          next: { revalidate: 86400 }, // cache city name 24h
        },
      ),
    ]);

    if (!weatherRes.ok) {
      return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
    }

    const weather = await weatherRes.json();
    const geo = geoRes.ok ? await geoRes.json() : null;

    const tempC = Math.round(weather.current.temperature_2m);
    const weatherCode = weather.current.weather_code;
    const humidity = weather.current.relative_humidity_2m;
    const windSpeed = weather.current.wind_speed_10m;

    // Extract city name from reverse geocoding
    const city = geo?.address?.city
      || geo?.address?.town
      || geo?.address?.village
      || geo?.address?.county
      || "your area";

    return NextResponse.json({
      tempC,
      tempF: Math.round(tempC * 9 / 5 + 32),
      condition: weatherCodeToCondition(weatherCode),
      humidity,
      windSpeed,
      city,
      // The weather category for outfit generation
      outfitWeather: tempToCategory(tempC),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
