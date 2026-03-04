import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

type CheckoutPayload = {
  priceId?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CheckoutPayload;
    const priceId = payload.priceId?.trim();

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_URL." }, { status: 500 });
    }
    const stripe = getStripe();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    let stripeCustomerId = profile?.stripe_customer_id as string | null;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      stripeCustomerId = customer.id;

      const { error: upsertError } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
        },
        { onConflict: "user_id" },
      );

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/home?subscribed=true`,
      cancel_url: `${appUrl}/pricing`,
      customer: stripeCustomerId,
      metadata: { user_id: user.id },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Unable to create checkout session." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create checkout session." },
      { status: 500 },
    );
  }
}
