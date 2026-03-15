import { supabase, hasSupabase } from './supabase';

/**
 * Create a Stripe Checkout Session via Supabase Edge Function
 * and redirect the browser to the hosted payment page.
 *
 * Falls back to demo unlock (no payment) when Supabase/Stripe isn't configured.
 */
export async function startCheckout(skinId, priceId, onDemoUnlock) {
  if (!hasSupabase || !priceId) {
    // Demo mode: unlock immediately
    onDemoUnlock?.(skinId);
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Not logged in: prompt login first
    await supabase.auth.signInWithOAuth({ provider: 'github' });
    return;
  }

  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId, skinId }),
      }
    );
    const { url, error } = await res.json();
    if (error) throw new Error(error);
    window.location.href = url;
  } catch (e) {
    console.error('Checkout failed:', e);
    // Fallback demo unlock so the user can still try the skin
    onDemoUnlock?.(skinId);
  }
}
