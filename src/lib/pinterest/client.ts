// Pinterest API v5 client — handles OAuth + board/pin fetching
// Docs: https://developers.pinterest.com/docs/api/v5/

const PINTEREST_API = "https://api.pinterest.com/v5";
const PINTEREST_AUTH = "https://www.pinterest.com/oauth";

// Get Pinterest OAuth URL with CSRF-safe random state
export function getPinterestAuthUrl(state: string): string {
  const clientId = process.env.PINTEREST_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/pinterest/callback`;

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "boards:read,pins:read",
    state,
  });

  return `${PINTEREST_AUTH}/?${params}`;
}

// Exchange auth code for access token
export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch(`${PINTEREST_API}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/pinterest/callback`,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Pinterest token exchange failed: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Fetch user's boards
export async function fetchBoards(accessToken: string): Promise<PinterestBoard[]> {
  const res = await fetch(`${PINTEREST_API}/boards?page_size=25`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch Pinterest boards");

  const data = await res.json();
  return data.items.map((b: PinterestBoardRaw) => ({
    id: b.id,
    name: b.name,
    description: b.description || "",
    pinCount: b.pin_count,
    imageUrl: b.media?.image_cover_url || null,
  }));
}

// Fetch pins from a specific board (up to 50 for analysis)
export async function fetchBoardPins(accessToken: string, boardId: string): Promise<PinterestPin[]> {
  // Validate boardId format to prevent path traversal / SSRF
  if (!/^[A-Za-z0-9_\-\/]{1,128}$/.test(boardId)) {
    throw new Error("Invalid board ID format");
  }

  const res = await fetch(`${PINTEREST_API}/boards/${encodeURIComponent(boardId)}/pins?page_size=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch board pins");

  const data = await res.json();
  return data.items.map((p: PinterestPinRaw) => ({
    id: p.id,
    title: p.title || "",
    description: p.description || "",
    imageUrl: p.media?.images?.["600x"]?.url || p.media?.images?.originals?.url || "",
    link: p.link || "",
    dominantColor: p.dominant_color || null,
  }));
}

// Fetch a single pin by ID (from URL)
export async function fetchPin(accessToken: string, pinId: string): Promise<PinterestPin> {
  const res = await fetch(`${PINTEREST_API}/pins/${pinId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Failed to fetch pin");

  const p: PinterestPinRaw = await res.json();
  return {
    id: p.id,
    title: p.title || "",
    description: p.description || "",
    imageUrl: p.media?.images?.["600x"]?.url || p.media?.images?.originals?.url || "",
    link: p.link || "",
    dominantColor: p.dominant_color || null,
  };
}

// Extract board/pin ID from a Pinterest URL — anchored regex to prevent injection
export function parsePinterestUrl(url: string): { type: "board" | "pin"; id: string } | null {
  // Board URL: pinterest.com/username/board-name/
  const boardMatch = url.match(/^https?:\/\/(www\.)?pinterest\.com\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\/?$/);
  if (boardMatch) {
    return { type: "board", id: `${boardMatch[2]}/${boardMatch[3]}` };
  }

  // Pin URL: pinterest.com/pin/12345/
  const pinMatch = url.match(/^https?:\/\/(www\.)?pinterest\.com\/pin\/(\d{1,20})\/?$/);
  if (pinMatch) {
    return { type: "pin", id: pinMatch[2] };
  }

  return null;
}

// Check if Pinterest integration is configured
export function isPinterestConfigured(): boolean {
  return !!(process.env.PINTEREST_APP_ID && process.env.PINTEREST_APP_SECRET);
}

// Types
export interface PinterestBoard {
  id: string;
  name: string;
  description: string;
  pinCount: number;
  imageUrl: string | null;
}

export interface PinterestPin {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  dominantColor: string | null;
}

interface PinterestBoardRaw {
  id: string;
  name: string;
  description?: string;
  pin_count: number;
  media?: { image_cover_url?: string };
}

interface PinterestPinRaw {
  id: string;
  title?: string;
  description?: string;
  media?: { images?: Record<string, { url: string }> };
  link?: string;
  dominant_color?: string;
}
