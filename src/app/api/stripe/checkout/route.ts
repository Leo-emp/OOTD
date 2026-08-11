// POST /api/stripe/checkout — create a Stripe Checkout session for Pro subscription
// Redirects user to Stripe-hosted payment page

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createCheckoutSession } from "@/lib/stripe";
import { z } from "zod";
import { checkRateLimit, checkoutRateLimit } from "@/lib/cache/rate-limit";

const CheckoutSchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit — prevent checkout session spam
  const { success } = await checkRateLimit(checkoutRateLimit, session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      plan: parsed.data.plan,
      successUrl: `${appUrl}/profile?upgraded=true`,
      cancelUrl: `${appUrl}/profile`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[Stripe] Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
