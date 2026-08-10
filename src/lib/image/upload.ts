import { put } from "@vercel/blob";

// Upload image to Vercel Blob — returns the public URL
export async function uploadToBlob(
  file: Buffer,
  userId: string,
  itemId: string,
  variant: "original" | "processed" | "thumb"
): Promise<string> {
  const ext = variant === "processed" ? "png" : "webp";
  const path = `wardrobe/${userId}/${itemId}/${variant}.${ext}`;

  const blob = await put(path, file, {
    access: "public",
    contentType: variant === "processed" ? "image/png" : "image/webp",
  });

  return blob.url;
}
