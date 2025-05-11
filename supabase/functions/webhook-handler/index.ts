
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.18.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  // Use the service role key for admin privileges to update user stats
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
  
  try {
    if (!signature || !webhookSecret) {
      throw new Error("Missing Stripe signature or webhook secret");
    }
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2022-11-15",
    });
    
    // Get the raw request body for verification
    const body = await req.text();
    
    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`⚠️  Webhook signature verification failed:`, err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    console.log(`Event received: ${event.type}`);
    
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer;
        const userId = session.metadata?.user_id;
        
        if (!userId) {
          throw new Error("User ID not found in session metadata");
        }
        
        // Handle subscription success
        if (session.mode === "subscription") {
          // Update the subscriber status
          await supabaseAdmin.from("subscribers").upsert({
            user_id: userId,
            subscribed: true,
            subscription_tier: "Premium",
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
          
          // Add 200 bonus points for new subscribers
          const { data: stats } = await supabaseAdmin
            .from("user_statistics")
            .select("points")
            .eq("user_id", userId)
            .single();
          
          if (stats) {
            await supabaseAdmin
              .from("user_statistics")
              .update({ points: stats.points + 200 })
              .eq("user_id", userId);
          }
          
          console.log(`✅ User ${userId} successfully subscribed and received 200 bonus points`);
        } 
        // Handle one-time payment for points
        else if (session.mode === "payment") {
          const pointsToAdd = parseInt(session.metadata?.points || "100");
          
          // Update user points
          const { data: stats } = await supabaseAdmin
            .from("user_statistics")
            .select("points")
            .eq("user_id", userId)
            .single();
          
          if (stats) {
            await supabaseAdmin
              .from("user_statistics")
              .update({ points: stats.points + pointsToAdd })
              .eq("user_id", userId);

            console.log(`✅ User ${userId} purchased ${pointsToAdd} points`);
          }
        }
        break;
      }
      
      case "customer.subscription.created": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Get subscription details
        const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Find the user associated with this customer
        const { data: customers } = await supabaseAdmin
          .from("subscribers")
          .select("user_id")
          .eq("stripe_customer_id", customerId);
        
        if (customers && customers.length > 0) {
          const userId = customers[0].user_id;
          
          // Update the subscriber status
          await supabaseAdmin
            .from("subscribers")
            .update({
              subscribed: true,
              subscription_tier: "Premium",
              subscription_end: subscriptionEnd,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
          
          console.log(`✅ Subscription created for user ${userId}, expires at ${subscriptionEnd}`);
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;
        const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        
        // Find the user associated with this customer
        const { data: customers } = await supabaseAdmin
          .from("subscribers")
          .select("user_id")
          .eq("stripe_customer_id", customerId);
        
        if (customers && customers.length > 0) {
          const userId = customers[0].user_id;
          
          // Update the subscriber status
          await supabaseAdmin
            .from("subscribers")
            .update({
              subscribed: status === "active" || status === "trialing",
              subscription_tier: (status === "active" || status === "trialing") ? "Premium" : null,
              subscription_end: subscriptionEnd,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
          
          console.log(`✅ Subscription updated for user ${userId}, status: ${status}, expires at ${subscriptionEnd}`);
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Find the user associated with this customer
        const { data: customers } = await supabaseAdmin
          .from("subscribers")
          .select("user_id")
          .eq("stripe_customer_id", customerId);
        
        if (customers && customers.length > 0) {
          const userId = customers[0].user_id;
          
          // Update the subscriber status
          await supabaseAdmin
            .from("subscribers")
            .update({
              subscribed: false,
              subscription_tier: null,
              subscription_end: null,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
          
          console.log(`✅ Subscription canceled for user ${userId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          // This is a subscription invoice
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
          
          // Find the user associated with this customer
          const { data: customers } = await supabaseAdmin
            .from("subscribers")
            .select("user_id")
            .eq("stripe_customer_id", customerId);
          
          if (customers && customers.length > 0) {
            const userId = customers[0].user_id;
            
            // Update the subscriber status
            await supabaseAdmin
              .from("subscribers")
              .update({
                subscribed: true,
                subscription_tier: "Premium",
                subscription_end: subscriptionEnd,
                updated_at: new Date().toISOString()
              })
              .eq("user_id", userId);
            
            console.log(`✅ Invoice payment succeeded for user ${userId}, subscription renewed until ${subscriptionEnd}`);
          }
        }
        break;
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`❌ Error processing webhook:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
