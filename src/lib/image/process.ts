import sharp from "sharp";
import { requireEnv } from "@/lib/env";

// Strip EXIF metadata and resize to max dimension
// Prevents location/device info leaking + normalizes size
export async function prepareUpload(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // auto-rotate based on EXIF, then strip it
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

// Generate thumbnail variant (400px for wardrobe grid)
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(400, 533, { fit: "cover" }) // 3:4 aspect ratio
    .webp({ quality: 80 })
    .toBuffer();
}

// Generate medium variant (800px for outfit cards)
export async function generateMedium(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(800, 1067, { fit: "cover" }) // 3:4 aspect ratio
    .webp({ quality: 85 })
    .toBuffer();
}

// Remove background via remove.bg API
export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const formData = new FormData();
  formData.append("image_file", new Blob([new Uint8Array(imageBuffer)]));
  formData.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": requireEnv("REMOVE_BG_API_KEY") },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Background removal failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
