import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

const CORE_MONTHLY_PRICE_ID = process.env.STRIPE_CORE_MONTHLY_PRICE_ID;
const CORE_YEARLY_PRICE_ID = process.env.STRIPE_CORE_YEARLY_PRICE_ID;
const PROFESSIONAL_MONTHLY_PRICE_ID = process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID;
const PROFESSIONAL_YEARLY_PRICE_ID = process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID;

type SubscriptionTier = "core" | "professional";
type SubscriptionInterval = "monthly" | "yearly";

function mapPriceToSubscription(priceId: string | null | undefined): {
  tier: SubscriptionTier;
  interval: SubscriptionInterval;
} | null {
  if (!priceId) return null;

  if (priceId === CORE_MONTHLY_PRICE_ID) {
    return { tier: "core", interval: "monthly" };
  }
  if (priceId === CORE_YEARLY_PRICE_ID) {
    return { tier: "core", interval: "yearly" };
  }
  if (priceId === PROFESSIONAL_MONTHLY_PRICE_ID) {
    return { tier: "professional", interval: "monthly" };
  }
  if (priceId === PROFESSIONAL_YEARLY_PRICE_ID) {
    return { tier: "professional", interval: "yearly" };
  }

  return null;
}

function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const stripe = getStripe();
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.user_id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  if (!userId || !subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const mapped = mapPriceToSubscription(priceId);
  if (!mapped) {
    return;
  }

  const adminSupabase = createAdminSupabaseClient();
  await adminSupabase
    .from("user_profiles")
    .update({
      subscription_tier: mapped.tier,
      subscription_interval: mapped.interval,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    })
    .eq("user_id", userId);
}

async function handleCustomerSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  if (!customerId) {
    return;
  }

  const adminSupabase = createAdminSupabaseClient();
  await adminSupabase
    .from("user_profiles")
    .update({
      subscription_tier: "none",
      subscription_interval: null,
      stripe_subscription_id: null,
    })
    .eq("stripe_customer_id", customerId);
}

async function handleCustomerSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const mapped = mapPriceToSubscription(priceId);

  if (!customerId || !mapped) {
    return;
  }

  const adminSupabase = createAdminSupabaseClient();
  await adminSupabase
    .from("user_profiles")
    .update({
      subscription_tier: mapped.tier,
      subscription_interval: mapped.interval,
      stripe_subscription_id: subscription.id,
    })
    .eq("stripe_customer_id", customerId);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(event);
    } else if (event.type === "customer.subscription.deleted") {
      await handleCustomerSubscriptionDeleted(event);
    } else if (event.type === "customer.subscription.updated") {
      await handleCustomerSubscriptionUpdated(event);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handler error." },
      { status: 400 },
    );
  }
}
