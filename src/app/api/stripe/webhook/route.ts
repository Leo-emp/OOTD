// POST /api/stripe/webhook — handle Stripe webhook events
// Processes: checkout.session.completed, subscription updates, cancellations
// Verify signature to prevent spoofed events

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Type-safe event data extraction
  const eventData = event.data.object as unknown as Record<string, unknown>;

  switch (event.type) {
    case "checkout.session.completed": {
      const userId = (eventData.metadata as Record<string, string>)?.userId;
      const subscriptionId = typeof eventData.subscription === "string"
        ? eventData.subscription : null;
      const customerId = typeof eventData.customer === "string"
        ? eventData.customer : null;

      if (!userId || !subscriptionId || !customerId) break;

      // Get subscription details from Stripe
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const subData = sub as unknown as Record<string, unknown>;
      const periodEnd = subData.current_period_end as number;

      // Upsert subscription record
      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });

      const subValues = {
        plan: "pro" as const,
        status: "active" as const,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existing) {
        await db.update(subscriptions).set(subValues).where(eq(subscriptions.id, existing.id));
      } else {
        await db.insert(subscriptions).values({ id: nanoid(), userId, ...subValues });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subMetadata = (eventData.metadata as Record<string, string>) || {};
      const userId = subMetadata.userId;
      if (!userId) break;

      const cancelAtPeriodEnd = eventData.cancel_at_period_end as boolean;
      const periodEnd = eventData.current_period_end as number;

      await db.update(subscriptions).set({
        status: cancelAtPeriodEnd ? "canceled" : "active",
        currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(subscriptions.userId, userId));
      break;
    }

    case "customer.subscription.deleted": {
      const delMetadata = (eventData.metadata as Record<string, string>) || {};
      const userId = delMetadata.userId;
      if (!userId) break;

      await db.update(subscriptions).set({
        plan: "free",
        status: "active",
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        updatedAt: new Date().toISOString(),
      }).where(eq(subscriptions.userId, userId));
      break;
    }

    case "invoice.payment_failed": {
      const subId = typeof eventData.subscription === "string"
        ? eventData.subscription : null;
      if (!subId) break;

      const sub = await stripe.subscriptions.retrieve(subId);
      const subMeta = (sub as unknown as Record<string, unknown>).metadata as Record<string, string>;
      const userId = subMeta?.userId;
      if (!userId) break;

      await db.update(subscriptions).set({
        status: "past_due",
        updatedAt: new Date().toISOString(),
      }).where(eq(subscriptions.userId, userId));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
