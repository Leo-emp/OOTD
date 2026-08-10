// Flat-lay composite renderer — assembles outfit items into a single editorial image
// Uses Sharp to fetch, resize, remove backgrounds, and compose items on a dark canvas
// Layout: fashion-editorial flat-lay arrangement (top-center, bottom below, shoes/accessories flanking)
// Output: 1080x1350 (4:5 Instagram-ready) or 1080x1080 (1:1 square)

import sharp from "sharp";

// ─── Types ───────────────────────────────────────────
interface FlatLayItem {
  imageUrl: string;
  position: "top" | "bottom" | "shoes" | "outerwear" | "accessory" | "bag";
}

interface FlatLayOptions {
  items: FlatLayItem[];
  genreSlug: string;
  // Canvas dimensions — 4:5 portrait by default (Instagram-optimal)
  width?: number;
  height?: number;
  // Output format
  format?: "webp" | "png" | "jpeg";
  quality?: number;
}

// ─── Genre accent colors for the subtle gradient glow behind items ───
const GENRE_ACCENTS: Record<string, { r: number; g: number; b: number }> = {
  "old-money":       { r: 201, g: 185, b: 154 },
  "y2k":             { r: 255, g: 105, b: 180 },
  "streetwear":      { r: 255, g: 77, b: 77 },
  "minimalist":      { r: 148, g: 163, b: 184 },
  "cottagecore":     { r: 134, g: 239, b: 172 },
  "dark-academia":   { r: 139, g: 115, b: 85 },
  "coastal-grandma": { r: 56, g: 189, b: 248 },
  "grunge":          { r: 107, g: 114, b: 128 },
  "coquette":        { r: 249, g: 168, b: 212 },
  "gorpcore":        { r: 167, g: 139, b: 250 },
  "clean-girl":      { r: 45, g: 212, b: 191 },
  "indie-boho":      { r: 249, g: 115, b: 22 },
};

// ─── Layout positions — where each piece goes on the canvas ───
// Canvas is 1080x1350. Items are sized proportionally and placed in editorial arrangement.
// The layout creates a natural "outfit laid out on a surface" look.
interface LayoutSlot {
  x: number;      // center-x position (0-1 normalized)
  y: number;      // center-y position (0-1 normalized)
  maxW: number;   // max width as fraction of canvas
  maxH: number;   // max height as fraction of canvas
  rotation: number; // subtle rotation in degrees for natural feel
  zIndex: number;  // compositing order (higher = on top)
}

// Primary layout: top + bottom + shoes (+ optional outerwear, accessory, bag)
function getLayoutSlots(positions: string[]): Record<string, LayoutSlot> {
  const has = (p: string) => positions.includes(p);

  // Base slots for the 3 essential pieces
  const slots: Record<string, LayoutSlot> = {};

  if (has("outerwear")) {
    // Outerwear gets the hero position — large, slightly behind the top
    slots["outerwear"] = { x: 0.50, y: 0.22, maxW: 0.55, maxH: 0.38, rotation: -2, zIndex: 1 };
    // Top goes slightly lower and smaller when outerwear is present
    slots["top"]       = { x: 0.48, y: 0.30, maxW: 0.40, maxH: 0.30, rotation: 1.5, zIndex: 2 };
  } else {
    // Top is the hero when no outerwear
    slots["top"]       = { x: 0.50, y: 0.24, maxW: 0.50, maxH: 0.35, rotation: -1, zIndex: 2 };
  }

  // Bottom — below the top, slightly offset for natural look
  slots["bottom"]      = { x: 0.48, y: 0.56, maxW: 0.45, maxH: 0.32, rotation: 1, zIndex: 3 };

  // Shoes — lower right, angled naturally
  slots["shoes"]       = { x: 0.68, y: 0.82, maxW: 0.30, maxH: 0.22, rotation: -8, zIndex: 4 };

  // Accessories — small, placed in gaps
  if (has("accessory")) {
    slots["accessory"] = { x: 0.22, y: 0.76, maxW: 0.20, maxH: 0.18, rotation: 12, zIndex: 5 };
  }

  if (has("bag")) {
    slots["bag"]       = { x: 0.25, y: 0.42, maxW: 0.22, maxH: 0.22, rotation: -5, zIndex: 5 };
  }

  return slots;
}

// ─── Allowed image hosts — only fetch from known CDNs, never internal services ───
const ALLOWED_IMAGE_HOSTS = [
  /\.public\.blob\.vercel-storage\.com$/,   // Vercel Blob (wardrobe uploads)
  /^img\.shopstyle-cdn\.com$/,              // ShopStyle product images
  /^placehold\.co$/,                        // Placeholder images (demo/seed)
  /^images\.unsplash\.com$/,                // Unsplash (mood boards)
  /^m\.media-amazon\.com$/,                 // Amazon product images
  /^cdn-images\.farfetch-contents\.com$/,   // Farfetch CDN
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB max per image

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // HTTPS only — block file://, http://, ftp://, data:, etc.
    if (parsed.protocol !== "https:") return false;
    // Check hostname against allowlist
    return ALLOWED_IMAGE_HOSTS.some((pattern) => pattern.test(parsed.hostname));
  } catch {
    return false;
  }
}

// ─── Fetch and prepare a single item image ───
async function fetchItemImage(url: string, maxW: number, maxH: number): Promise<ReturnType<typeof sharp>> {
  // SSRF protection — only fetch from known image CDNs
  if (!isAllowedImageUrl(url)) {
    throw new Error(`Blocked: image host not in allowlist`);
  }

  // Fetch the image — no redirects to prevent DNS-rebinding bypass
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    redirect: "error",
    headers: { "User-Agent": "OOTD-AI/1.0 FlatLay-Renderer" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  // Enforce max size to prevent memory exhaustion
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large: ${contentLength} bytes`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large: ${buffer.length} bytes`);
  }

  // Resize to fit within the allocated slot, maintaining aspect ratio
  // Use "contain" to preserve the full item without cropping
  return sharp(buffer)
    .resize(Math.round(maxW), Math.round(maxH), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ quality: 95 });
}

// ─── Create the ambient glow circle behind each item ───
async function createGlow(
  width: number,
  height: number,
  accent: { r: number; g: number; b: number },
  opacity: number = 0.08,
): Promise<Buffer> {
  // Radial gradient-like glow using a blurred white ellipse tinted with the accent color
  const size = Math.max(width, height);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: accent.r, g: accent.g, b: accent.b, alpha: Math.round(opacity * 255) },
    },
  })
    .blur(size * 0.35)
    .resize(width, height, { fit: "fill" })
    .png()
    .toBuffer();
}

// ─── Create the dark textured background canvas ───
async function createCanvas(
  width: number,
  height: number,
  accent: { r: number; g: number; b: number },
): Promise<Buffer> {
  // Dark background with a subtle gradient and grain texture
  // Base: near-black (#0A0A0A)
  const base = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 255 },
    },
  });

  // Add a subtle radial accent glow in the center of the canvas
  const centerGlow = await sharp({
    create: {
      width: Math.round(width * 0.8),
      height: Math.round(height * 0.8),
      channels: 4,
      background: { r: accent.r, g: accent.g, b: accent.b, alpha: 15 },
    },
  })
    .blur(width * 0.25)
    .resize(width, height, { fit: "fill" })
    .png()
    .toBuffer();

  // Subtle noise texture for depth — creates a fine grain
  const noiseWidth = Math.min(width, 540);
  const noiseHeight = Math.min(height, 675);
  const noisePixels = noiseWidth * noiseHeight * 4;
  const noiseData = Buffer.alloc(noisePixels);
  // Deterministic noise pattern (seeded by dimensions, not random)
  for (let i = 0; i < noisePixels; i += 4) {
    const pixelIndex = i / 4;
    // Simple hash-based noise instead of Math.random()
    const hash = ((pixelIndex * 2654435761) >>> 0) % 256;
    const grain = hash > 200 ? 20 : hash > 180 ? 12 : 0;
    noiseData[i] = grain;     // r
    noiseData[i + 1] = grain; // g
    noiseData[i + 2] = grain; // b
    noiseData[i + 3] = grain > 0 ? 30 : 0; // alpha
  }

  const noise = await sharp(noiseData, {
    raw: { width: noiseWidth, height: noiseHeight, channels: 4 },
  })
    .resize(width, height, { fit: "fill", kernel: "nearest" })
    .png()
    .toBuffer();

  // Composite: base + center glow + noise
  return base
    .composite([
      { input: centerGlow, blend: "screen" },
      { input: noise, blend: "overlay" },
    ])
    .png()
    .toBuffer();
}

// ─── Apply rotation to an image buffer ───
async function rotateImage(buffer: Buffer, degrees: number): Promise<Buffer> {
  if (Math.abs(degrees) < 0.5) return buffer;

  return sharp(buffer)
    .rotate(degrees, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// ─── Create a subtle drop shadow for an item ───
async function createShadow(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width: width + 20,
      height: height + 20,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 80 },
    },
  })
    .blur(12)
    .png()
    .toBuffer();
}

// ─── Main renderer ───────────────────────────────────
export async function renderFlatLay(options: FlatLayOptions): Promise<Buffer> {
  const {
    items,
    genreSlug,
    width = 1080,
    height = 1350,
    format = "webp",
    quality = 88,
  } = options;

  // Get the accent color for this genre
  const accent = GENRE_ACCENTS[genreSlug] || { r: 192, g: 132, b: 252 };

  // Determine layout slots based on which positions are present
  const positions = items.map((i) => i.position);
  const layoutSlots = getLayoutSlots(positions);

  // Create the dark textured canvas
  const canvasBuffer = await createCanvas(width, height, accent);

  // Fetch and prepare all item images in parallel
  const compositeInputs: { input: Buffer; left: number; top: number; zIndex: number }[] = [];

  const itemResults = await Promise.allSettled(
    items.map(async (item) => {
      const slot = layoutSlots[item.position];
      if (!slot) return null;

      // Calculate pixel dimensions for this slot
      const slotW = Math.round(width * slot.maxW);
      const slotH = Math.round(height * slot.maxH);

      // Fetch and resize the item image
      const itemSharp = await fetchItemImage(item.imageUrl, slotW, slotH);
      let itemBuffer = await itemSharp.toBuffer();

      // Get actual dimensions after resize
      const meta = await sharp(itemBuffer).metadata();
      const itemW = meta.width || slotW;
      const itemH = meta.height || slotH;

      // Apply subtle rotation for natural flat-lay feel
      const rotatedBuffer = await rotateImage(itemBuffer, slot.rotation);

      // Get rotated dimensions
      const rotatedMeta = await sharp(rotatedBuffer).metadata();
      const rotW = rotatedMeta.width || itemW;
      const rotH = rotatedMeta.height || itemH;

      // Calculate position (centered on the slot's x,y point)
      const left = Math.round(width * slot.x - rotW / 2);
      const top = Math.round(height * slot.y - rotH / 2);

      // Create ambient glow behind the item
      const glowBuffer = await createGlow(
        Math.round(rotW * 1.4),
        Math.round(rotH * 1.4),
        accent,
        0.06,
      );
      const glowLeft = Math.round(left - rotW * 0.2);
      const glowTop = Math.round(top - rotH * 0.2);

      // Create drop shadow
      const shadowBuffer = await createShadow(rotW, rotH);
      const shadowLeft = left - 4;
      const shadowTop = top + 6;

      return {
        glow: { input: glowBuffer, left: Math.max(0, glowLeft), top: Math.max(0, glowTop), zIndex: slot.zIndex - 0.2 },
        shadow: { input: shadowBuffer, left: Math.max(0, shadowLeft), top: Math.max(0, shadowTop), zIndex: slot.zIndex - 0.1 },
        item: { input: rotatedBuffer, left: Math.max(0, left), top: Math.max(0, top), zIndex: slot.zIndex },
      };
    })
  );

  // Collect successful results, sorted by z-index for proper layering
  for (const result of itemResults) {
    if (result.status === "fulfilled" && result.value) {
      compositeInputs.push(result.value.glow);
      compositeInputs.push(result.value.shadow);
      compositeInputs.push(result.value.item);
    }
  }

  // Sort by z-index so items layer correctly
  compositeInputs.sort((a, b) => a.zIndex - b.zIndex);

  // Compose everything onto the canvas
  const composited = sharp(canvasBuffer).composite(
    compositeInputs.map(({ input, left, top }) => ({
      input,
      left,
      top,
      blend: "over" as const,
    }))
  );

  // Output in the requested format
  switch (format) {
    case "png":
      return composited.png({ quality }).toBuffer();
    case "jpeg":
      return composited.jpeg({ quality, mozjpeg: true }).toBuffer();
    case "webp":
    default:
      return composited.webp({ quality, effort: 4 }).toBuffer();
  }
}

// ─── Quick validation — at least top+bottom or top+shoes needed ───
export function canRenderFlatLay(positions: string[]): boolean {
  const hasTop = positions.includes("top") || positions.includes("outerwear");
  const hasBottom = positions.includes("bottom");
  const hasShoes = positions.includes("shoes");
  return hasTop && (hasBottom || hasShoes);
}
