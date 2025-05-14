
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Import Stripe only if needed
// For the purposes of this file, we're assuming Stripe is configured elsewhere

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the raw body as text for webhook signature verification
    const body = await req.text();
    
    // In a real implementation, you would verify the webhook signature
    // For now, just parse the JSON
    const data = JSON.parse(body);
    
    // Process webhook event based on type
    const eventType = data.type;
    
    console.log(`Webhook event received: ${eventType}`);

    // Handle the event
    switch (eventType) {
      case 'checkout.session.completed': {
        // Process successful checkout session
        await handleCheckoutSession(data.data.object);
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        // Handle subscription events
        await handleSubscriptionUpdate(data.data.object);
        break;
      }
      
      // Add other event types as needed
      
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// Helper functions for webhook handling
async function handleCheckoutSession(session) {
  // Extract customer and metadata
  const { customer, metadata } = session;
  
  if (!customer || !metadata || !metadata.user_id) {
    console.error('Missing required session data:', { customer, metadata });
    return;
  }
  
  const userId = metadata.user_id;
  
  console.log(`Processing checkout for user: ${userId}`);
  
  // Handle different checkout modes
  if (session.mode === 'subscription') {
    // Handle subscription purchase
    await updateSubscriptionStatus(userId, true, session.customer, 'premium');
  } else if (session.mode === 'payment' && metadata.points) {
    // Handle one-time points purchase
    const pointsToAdd = parseInt(metadata.points, 10);
    if (pointsToAdd) {
      await addUserPoints(userId, pointsToAdd);
    }
  }
}

async function handleSubscriptionUpdate(subscription) {
  // Get customer ID and status
  const customerId = subscription.customer;
  const status = subscription.status;
  
  // Get user ID from metadata
  const { data: customerData, error: customerError } = await supabase
    .from('subscribers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (customerError || !customerData) {
    console.error('Error finding user for subscription:', customerError || 'No user found');
    return;
  }
  
  const userId = customerData.user_id;
  const isActive = ['active', 'trialing'].includes(status);
  
  await updateSubscriptionStatus(userId, isActive, customerId, isActive ? 'premium' : null);
}

async function updateSubscriptionStatus(userId, isSubscribed, customerId, tier) {
  try {
    // Update or insert subscription record
    const { data: existingSubscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      // Real error, not just "no rows found"
      throw fetchError;
    }
    
    if (existingSubscriber) {
      // Update existing record
      await supabase
        .from('subscribers')
        .update({
          subscribed: isSubscribed,
          stripe_customer_id: customerId,
          subscription_tier: tier,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Insert new record
      await supabase
        .from('subscribers')
        .insert({
          user_id: userId,
          subscribed: isSubscribed,
          stripe_customer_id: customerId,
          subscription_tier: tier
        });
    }
    
    // If subscribing, also add bonus points
    if (isSubscribed && tier === 'premium') {
      await addUserPoints(userId, 200); // Bonus points for premium subscription
    }
    
    console.log(`Updated subscription status for user ${userId}: ${isSubscribed ? 'Active' : 'Inactive'}`);
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

async function addUserPoints(userId, pointsToAdd) {
  try {
    // Check if user_statistics record exists
    const { data: statsData, error: statsError } = await supabase
      .from('user_statistics')
      .select('points')
      .eq('user_id', userId)
      .single();
      
    if (statsError && statsError.code !== 'PGRST116') {
      // Real error, not just "no rows found"
      throw statsError;
    }
    
    if (statsData) {
      // Update existing stats
      await supabase
        .from('user_statistics')
        .update({
          points: statsData.points + pointsToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Create new stats record
      await supabase
        .from('user_statistics')
        .insert({
          user_id: userId,
          points: 10 + pointsToAdd, // Default starting points + purchased points
          followers_gained: 0,
          ideas_generated: 0,
          analyses_completed: 0
        });
    }
    
    console.log(`Added ${pointsToAdd} points to user ${userId}`);
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
}
