
import Stripe from 'https://esm.sh/stripe@11.18.0?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});
