import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Safe API route handler — wraps route logic with auth + try/catch + consistent error shape
// Eliminates the need for try/catch in every route file
// Returns { error: string } with appropriate status code on any failure
export function safeHandler(
  handler: (request: NextRequest, session: { user: { id: string; email: string; name: string } }) => Promise<NextResponse>,
  options?: { public?: boolean },
) {
  return async (request: NextRequest) => {
    try {
      // Auth check — skip for public endpoints
      if (!options?.public) {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return await handler(request, session as { user: { id: string; email: string; name: string } });
      }

      // Public route — pass empty session
      return await handler(request, { user: { id: "", email: "", name: "" } });
    } catch (err) {
      console.error(`[API] ${request.method} ${request.nextUrl.pathname} failed:`, err);

      // Zod validation errors
      if (err && typeof err === "object" && "issues" in err) {
        return NextResponse.json(
          { error: "Validation failed", details: (err as { issues: unknown[] }).issues },
          { status: 400 },
        );
      }

      const message = err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

// Parse JSON body safely — returns null if body is missing or malformed
export async function parseBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}
