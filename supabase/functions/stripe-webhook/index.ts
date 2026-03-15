// Supabase Edge Function: handle Stripe webhooks to unlock skins after payment
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Map Stripe price IDs to skin IDs
const PRICE_TO_SKIN: Record<string, string> = {
  [Deno.env.get('STRIPE_CYBER_PRICE') ?? '']:    'cyber',
  [Deno.env.get('STRIPE_PIXEL_PRICE') ?? '']:    'pixel',
  [Deno.env.get('STRIPE_GOLDEN_PRICE') ?? '']:   'golden',
  [Deno.env.get('STRIPE_SPACE_PRICE') ?? '']:    'space',
  [Deno.env.get('STRIPE_GUOCHAO_PRICE') ?? '']:  'guochao',
  [Deno.env.get('STRIPE_BUNDLE_PRICE') ?? '']:   'bundle',
};

const ALL_SKINS = ['cyber', 'pixel', 'golden', 'space', 'guochao'];

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    );
  } catch (err) {
    return new Response(`Webhook error: ${err}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const priceId = session.metadata?.price_id
      || (session as any).line_items?.data?.[0]?.price?.id;

    if (!userId || !priceId) {
      return new Response('Missing metadata', { status: 400 });
    }

    const skinId = PRICE_TO_SKIN[priceId];
    if (!skinId) {
      return new Response('Unknown price', { status: 400 });
    }

    const skinsToUnlock = skinId === 'bundle' ? ALL_SKINS : [skinId];

    // Fetch current owned skins
    const { data: profile } = await supabase
      .from('profiles')
      .select('owned_skins')
      .eq('id', userId)
      .single();

    const current: string[] = profile?.owned_skins ?? ['classic'];
    const merged = Array.from(new Set([...current, ...skinsToUnlock]));

    await supabase
      .from('profiles')
      .update({ owned_skins: merged })
      .eq('id', userId);

    console.log(`Unlocked ${skinsToUnlock.join(', ')} for user ${userId}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
