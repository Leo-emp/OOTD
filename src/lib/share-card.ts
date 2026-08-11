// ── Share Card Generator ──
// Canvas-based image generation for shareable Style DNA + Score cards
// Produces Instagram Story-sized (1080x1920) or square (1080x1080) PNGs
// No external dependencies — uses native HTMLCanvasElement

// Genre display names + accent colors for canvas rendering
const GENRE_INFO: Record<string, { name: string; color: string }> = {
  "old-money": { name: "Old Money", color: "#C9B99A" },
  "y2k": { name: "Y2K", color: "#FF69B4" },
  "streetwear": { name: "Streetwear", color: "#FF4D4D" },
  "minimalist": { name: "Minimalist", color: "#94A3B8" },
  "cottagecore": { name: "Cottagecore", color: "#86EFAC" },
  "dark-academia": { name: "Dark Academia", color: "#8B7355" },
  "coastal-grandma": { name: "Coastal Grandma", color: "#38BDF8" },
  "grunge": { name: "Grunge", color: "#6B7280" },
  "coquette": { name: "Coquette", color: "#F9A8D4" },
  "gorpcore": { name: "Gorpcore", color: "#A78BFA" },
  "clean-girl": { name: "Clean Girl", color: "#2DD4BF" },
  "indie-boho": { name: "Indie/Boho", color: "#F97316" },
};

// Helper — round-rect for canvas (used for bars, badges, etc.)
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Draw subtle dot pattern for texture (instead of flat background)
function drawDotGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  for (let x = 0; x < w; x += 24) {
    for (let y = 0; y < h; y += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Style DNA Card Generator ──
// Produces a 1080×1920 (9:16 Story) branded share card
export function generateStyleDnaCard(data: {
  name: string;
  primaryGenre: string;
  secondaryGenre?: string | null;
  accentGenre?: string | null;
  breakdown: { genre: string; percentage: number }[];
}): string {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background — deep purple gradient ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0F0B15");
  bg.addColorStop(0.4, "#1A0F2E");
  bg.addColorStop(1, "#0F0B15");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Dot texture overlay
  drawDotGrid(ctx, W, H);

  // ── Accent glow from primary genre color ──
  const primaryInfo = GENRE_INFO[data.primaryGenre] || { name: data.primaryGenre, color: "#C084FC" };
  const glow = ctx.createRadialGradient(W / 2, 400, 0, W / 2, 400, 500);
  glow.addColorStop(0, primaryInfo.color + "25");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top branding — "OOTD AI" ──
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.fillText("OOTD AI", W / 2, 100);

  // ── Main title — "MY STYLE DNA" ──
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 72px Georgia, serif";
  ctx.fillText("MY STYLE", W / 2, 260);
  ctx.fillText("DNA", W / 2, 350);

  // ── Gradient accent line under title ──
  const lineGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  lineGrad.addColorStop(0, "#FF6B9D");
  lineGrad.addColorStop(0.5, "#C084FC");
  lineGrad.addColorStop(1, "#60A5FA");
  ctx.fillStyle = lineGrad;
  roundRect(ctx, W / 2 - 200, 380, 400, 4, 2);
  ctx.fill();

  // ── User name ──
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "400 32px system-ui, sans-serif";
  ctx.fillText(data.name, W / 2, 450);

  // ── Primary genre — large featured display ──
  ctx.fillStyle = primaryInfo.color;
  ctx.font = "bold 56px Georgia, serif";
  ctx.fillText(primaryInfo.name.toUpperCase(), W / 2, 580);
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "400 26px system-ui, sans-serif";
  ctx.fillText("DOMINANT GENRE", W / 2, 630);

  // ── Genre breakdown bars ──
  const barStartY = 720;
  const barX = 100;
  const barMaxW = W - 200;
  const barH = 48;
  const barGap = 24;

  ctx.textAlign = "left";
  data.breakdown.forEach((item, i) => {
    const genre = GENRE_INFO[item.genre] || { name: item.genre, color: "#C084FC" };
    const y = barStartY + i * (barH + barGap + 40);

    // Genre label + percentage
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(genre.name, barX, y);
    ctx.textAlign = "right";
    ctx.fillStyle = genre.color;
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.fillText(`${item.percentage}%`, barX + barMaxW, y);
    ctx.textAlign = "left";

    // Background bar track
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    roundRect(ctx, barX, y + 12, barMaxW, barH, barH / 2);
    ctx.fill();

    // Filled progress bar
    const fillW = (item.percentage / 100) * barMaxW;
    const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    barGrad.addColorStop(0, genre.color);
    barGrad.addColorStop(1, genre.color + "80");
    ctx.fillStyle = barGrad;
    roundRect(ctx, barX, y + 12, fillW, barH, barH / 2);
    ctx.fill();
  });

  // ── Personality descriptor based on genre mix ──
  const personalityY = barStartY + data.breakdown.length * (barH + barGap + 40) + 60;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  roundRect(ctx, 60, personalityY - 20, W - 120, 100, 20);
  ctx.fill();

  // Generate a fun personality line based on the dominant genre
  const personalities: Record<string, string> = {
    "old-money": "quiet luxury connoisseur",
    "y2k": "nostalgia-core icon",
    "streetwear": "drip architect",
    "minimalist": "less-is-more purist",
    "cottagecore": "countryside dreamer",
    "dark-academia": "literary romantic",
    "coastal-grandma": "seaside sophisticate",
    "grunge": "anti-fashion rebel",
    "coquette": "soft-glam princess",
    "gorpcore": "adventure-chic explorer",
    "clean-girl": "effortless beauty",
    "indie-boho": "free-spirit creative",
  };
  const personality = personalities[data.primaryGenre] || "style chameleon";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "italic 36px Georgia, serif";
  ctx.fillText(`"${personality}"`, W / 2, personalityY + 35);

  // ── Bottom branding ──
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText("Discover yours at ootd-ai.vercel.app", W / 2, H - 100);

  // Brand gradient bar at very bottom
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, H - 8, W, 8);

  return canvas.toDataURL("image/png");
}

// ── Score Card Generator ──
// Produces a 1080×1080 (1:1) card for Rate My Outfit results
export function generateScoreCard(data: {
  score: number;
  genre: string;
  genreAlignment: number;
  feedback: string;
}): string {
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  const genreInfo = GENRE_INFO[data.genre] || { name: data.genre, color: "#C084FC" };

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, "#0F0B15");
  bg.addColorStop(0.5, "#1A0F2E");
  bg.addColorStop(1, "#0F0B15");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);
  drawDotGrid(ctx, S, S);

  // Score glow
  const scoreColor = data.score >= 8 ? "#22C55E" : data.score >= 5 ? "#EAB308" : "#EF4444";
  const glow = ctx.createRadialGradient(S / 2, S / 2 - 60, 0, S / 2, S / 2 - 60, 300);
  glow.addColorStop(0, scoreColor + "20");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // ── Top branding ──
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "500 24px system-ui, sans-serif";
  ctx.fillText("OOTD AI — RATE MY OUTFIT", S / 2, 80);

  // ── Genre badge ──
  ctx.fillStyle = genreInfo.color + "30";
  roundRect(ctx, S / 2 - 120, 110, 240, 44, 22);
  ctx.fill();
  ctx.fillStyle = genreInfo.color;
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText(genreInfo.name, S / 2, 140);

  // ── Large score circle ──
  const cx = S / 2;
  const cy = S / 2 - 40;
  const radius = 160;

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 12;
  ctx.stroke();

  // Score arc (fills proportionally)
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (data.score / 10) * Math.PI * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = scoreColor;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.stroke();

  // Score number
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 120px Georgia, serif";
  ctx.fillText(data.score.toString(), cx, cy + 20);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "400 36px system-ui, sans-serif";
  ctx.fillText("/ 10", cx, cy + 70);

  // ── Genre alignment ──
  ctx.fillStyle = genreInfo.color;
  ctx.font = "bold 32px system-ui, sans-serif";
  ctx.fillText(`${data.genreAlignment}%`, cx, cy + 240);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "400 22px system-ui, sans-serif";
  ctx.fillText(`${genreInfo.name} alignment`, cx, cy + 275);

  // ── Feedback text (wrapped) ──
  const maxWidth = S - 160;
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "400 26px system-ui, sans-serif";
  const words = data.feedback.split(" ");
  let line = "";
  let feedbackY = S - 200;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), cx, feedbackY);
      line = word + " ";
      feedbackY += 36;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), cx, feedbackY);

  // ── Bottom branding ──
  const lineGrad = ctx.createLinearGradient(0, 0, S, 0);
  lineGrad.addColorStop(0, "#FF6B9D");
  lineGrad.addColorStop(0.5, "#C084FC");
  lineGrad.addColorStop(1, "#60A5FA");
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, S - 8, S, 8);

  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.font = "400 20px system-ui, sans-serif";
  ctx.fillText("ootd-ai.vercel.app", cx, S - 30);

  return canvas.toDataURL("image/png");
}

// ── Share Helpers ──

// Download a data URL as a PNG file
export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Share via Web Share API (falls back to clipboard)
export async function shareCard(data: {
  title: string;
  text: string;
  url?: string;
  imageDataUrl?: string;
}): Promise<boolean> {
  // Try Web Share API with image blob if supported
  if (data.imageDataUrl && navigator.share) {
    try {
      const blob = await (await fetch(data.imageDataUrl)).blob();
      const file = new File([blob], "ootd-ai-card.png", { type: "image/png" });
      await navigator.share({
        title: data.title,
        text: data.text,
        files: [file],
      });
      return true;
    } catch {
      // User cancelled or files not supported — try URL share
    }
  }

  // Fallback: share URL via Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url || window.location.href,
      });
      return true;
    } catch {
      // User cancelled
      return false;
    }
  }

  // Final fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(
      `${data.text}\n${data.url || window.location.href}`
    );
    return true;
  } catch {
    return false;
  }
}
