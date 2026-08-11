import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wardrobeItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { validateImageFile } from "@/lib/image/validate";
import { prepareUpload, generateThumbnail, removeBackground } from "@/lib/image/process";
import { uploadToBlob } from "@/lib/image/upload";
import { geminiProvider } from "@/lib/ai/fallback";
import { checkRateLimit, uploadRateLimit } from "@/lib/cache/rate-limit";
import { getUserPlan } from "@/lib/stripe/plan";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check — Pro users get higher upload limits
    const plan = await getUserPlan(session.user.id);
    const { success, remaining } = await checkRateLimit(
      uploadRateLimit[plan],
      session.user.id
    );
    if (!success) {
      return NextResponse.json(
        { error: "Upload limit reached", remaining },
        { status: 429 }
      );
    }

    // Check Content-Length header before reading body — reject oversized payloads early
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate file type and size
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const itemId = nanoid();
    const userId = session.user.id;

    // Prepare image — strip EXIF, resize, convert to WebP
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const prepared = await prepareUpload(rawBuffer);

    // Upload original immediately — optimistic UI shows this right away
    const originalUrl = await uploadToBlob(prepared, userId, itemId, "original");

    // Insert DB record in "processing" state
    await db.insert(wardrobeItems).values({
      id: itemId,
      userId,
      imageUrl: originalUrl,
      status: "processing",
    });

    // Background processing — don't await, return immediately for optimistic UI
    processInBackground(itemId, userId, prepared).catch(console.error);

    return NextResponse.json({
      id: itemId,
      imageUrl: originalUrl,
      status: "processing",
    });
  } catch (err) {
    console.error("[API] POST /api/wardrobe/upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// Runs after response is sent — user sees item immediately
async function processInBackground(itemId: string, userId: string, imageBuffer: Buffer) {
  try {
    // 1. AI classification — is it clothing? what kind?
    const base64 = imageBuffer.toString("base64");
    const analysis = await geminiProvider.analyzeClothing(base64);

    if (!analysis.isClothing) {
      await db
        .update(wardrobeItems)
        .set({ status: "rejected", rejectionReason: analysis.rejectionReason || "Not a clothing item" })
        .where(eq(wardrobeItems.id, itemId));
      return;
    }

    // 2. Background removal (non-fatal if fails)
    let processedUrl: string | undefined;
    try {
      const bgRemoved = await removeBackground(imageBuffer);
      processedUrl = await uploadToBlob(bgRemoved, userId, itemId, "processed");
    } catch {
      // Continue without bg removal — not critical
    }

    // 3. Generate thumbnail
    const thumb = await generateThumbnail(imageBuffer);
    const thumbUrl = await uploadToBlob(thumb, userId, itemId, "thumb");

    // 4. Update DB with all classifications
    await db
      .update(wardrobeItems)
      .set({
        imageThumbUrl: thumbUrl,
        imageProcessedUrl: processedUrl,
        category: analysis.category,
        color: analysis.color,
        pattern: analysis.pattern,
        genreTags: analysis.genreCompatibility,
        season: analysis.season,
        status: "ready",
      })
      .where(eq(wardrobeItems.id, itemId));
  } catch (error) {
    console.error("[Wardrobe] Background processing failed:", error);
    await db
      .update(wardrobeItems)
      .set({ status: "rejected", rejectionReason: "Processing failed, please try again" })
      .where(eq(wardrobeItems.id, itemId));
  }
}
