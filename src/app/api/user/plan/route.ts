// GET /api/user/plan — returns the user's current subscription plan
// Used by profile page and any client component that needs plan-gated UI

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserPlan } from "@/lib/stripe/plan";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getUserPlan(session.user.id);
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("[API] GET /api/user/plan failed:", err);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
