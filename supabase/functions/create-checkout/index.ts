
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";
import { stripe } from "../_shared/stripe.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get JWT token from request headers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is logged in
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get request body for checkout options
    let body;
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }
    
    const mode = body.mode || "payment";
    
    // Find customer or create new one
    const { data: customer, error: customerError } = await getOrCreateCustomer(user);
    
    if (customerError) {
      throw customerError;
    }
    
    const baseUrl = req.headers.get("origin") || "https://jemwnyrrjuffecuwntzw.lovable.ai";
    const checkoutSession = await createCheckoutSession(mode, customer.id, baseUrl, user.id, body);

    return new Response(
      JSON.stringify({ url: checkoutSession.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Helper functions

async function getOrCreateCustomer(user) {
  // Check if user already has a customer account
  const { data: subscriber, error: subError } = await supabase
    .from("subscribers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();
  
  if (subError && subError.code !== "PGRST116") {
    // If there's an error other than "no rows returned"
    throw subError;
  }
  
  if (subscriber?.stripe_customer_id) {
    // Return existing customer
    return { data: { id: subscriber.stripe_customer_id }, error: null };
  }
  
  // Create new customer
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: user.id,
      },
    });
    
    // Store Stripe customer ID in Supabase
    const { error: insertError } = await supabase
      .from("subscribers")
      .insert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        email: user.email,
      });
    
    if (insertError) {
      console.error("Error storing customer ID:", insertError);
      // Don't throw here, we still want to proceed with checkout
    }
    
    return { data: customer, error: null };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { data: null, error };
  }
}

async function createCheckoutSession(mode, customerId, baseUrl, userId, options = {}) {
  const lineItems = [];
  const metadata = { user_id: userId };
  
  if (mode === "subscription") {
    // Subscription checkout
    lineItems.push({
      price: "price_1P34vrGSrWGk6AHMz2GXD5f3", // Replace with your actual price ID
      quantity: 1,
    });
  } else {
    // One-time payment for points
    const pointsAmount = options.points || 100;
    
    metadata.points = pointsAmount.toString();
    
    lineItems.push({
      price_data: {
        currency: "brl",
        product_data: {
          name: `${pointsAmount} Pontos`,
          description: `Pacote de ${pointsAmount} pontos para TikTool`,
        },
        unit_amount: pointsAmount * 10, // 100 points = R$ 10,00, so 1 point = R$ 0.10
      },
      quantity: 1,
    });
  }
  
  return stripe.checkout.sessions.create({
    customer: customerId,
    line_items: lineItems,
    mode: mode,
    success_url: `${baseUrl}?success=true`,
    cancel_url: `${baseUrl}?canceled=true`,
    metadata: metadata,
  });
}
