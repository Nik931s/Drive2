import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabaseServer';

// This route creates a Stripe Checkout session. It's a real, working payment
// hook — but it will only actually process money once you:
//   1. Create a Stripe account (stripe.com)
//   2. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_SITE_URL to your env vars
//   3. Point a Stripe webhook at /api/webhooks/stripe (see that file)
// Until then, calling this route will return an error, which is expected.
export async function POST(request: Request) {
  try {
    const { listingId, purpose } = await request.json();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 500 }
      );
    }
    const prices: Record<string, number> = {
      featured_listing: 1500, // $15.00, in cents
      deposit: 10000,         // example: $100.00 refundable deposit
    };
    const amountCents = prices[purpose] || 1500;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: purpose === 'deposit' ? 'Refundable deposit' : 'Featured listing (7 days)' },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: { listingId, purpose, userId: user.id },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/listing/${listingId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/listing/${listingId}?payment=cancelled`,
    });
    await supabase.from('payments').insert({
      user_id: user.id,
      listing_id: listingId,
      stripe_session_id: session.id,
      amount: amountCents / 100,
      purpose,
      status: 'pending',
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
