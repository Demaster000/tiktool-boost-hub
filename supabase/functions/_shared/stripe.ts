
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

// Initialize Stripe with the secret key from environment variables
export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15', // Use appropriate API version
});
