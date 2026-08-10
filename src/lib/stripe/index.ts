// Stripe integration — handles Pro subscription ($24.99/mo, $199/yr)
// Server-side only — keys never exposed to client

import Stripe from "stripe";

// Lazy-initialized Stripe client — avoids crash at build time when env vars aren't set
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// Backward compat — proxy that lazily initializes
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Price IDs — set these in Stripe Dashboard
// Monthly: $24.99/mo — create as recurring monthly product
// Yearly: $199/yr — create as recurring yearly product
export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || "",
  yearly: process.env.STRIPE_PRICE_YEARLY || "",
};

// Create a checkout session for subscription
export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  plan: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}) {
  const priceId = PRICE_IDS[params.plan];
  if (!priceId) throw new Error(`No price ID configured for ${params.plan} plan`);

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId },
    subscription_data: {
      metadata: { userId: params.userId },
    },
  });
}

// Create a customer portal session (manage billing, cancel, etc.)
export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Get subscription status for a customer
export async function getSubscriptionStatus(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subData = subscription as unknown as Record<string, unknown>;
  return {
    status: subData.status as string,
    currentPeriodEnd: new Date((subData.current_period_end as number) * 1000).toISOString(),
    cancelAtPeriodEnd: subData.cancel_at_period_end as boolean,
  };
}
