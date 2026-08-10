// GET /api/pinterest/boards — list user's Pinterest boards
// Returns board list for the board selector UI

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { pinterestConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchBoards } from "@/lib/pinterest/client";

export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connection = await db.query.pinterestConnections.findFirst({
    where: eq(pinterestConnections.userId, session.user.id),
  });

  if (!connection) {
    return NextResponse.json({ connected: false, boards: [] });
  }

  try {
    const boards = await fetchBoards(connection.accessToken);
    return NextResponse.json({ connected: true, boards });
  } catch {
    return NextResponse.json({ connected: false, boards: [], error: "Token expired" });
  }
}
