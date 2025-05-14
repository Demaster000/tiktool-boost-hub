
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

    // Get the customer's Stripe ID
    const { data: subscriber, error: subError } = await supabase
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    
    if (subError || !subscriber?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No subscription found for this user" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Create a customer portal session
    const baseUrl = req.headers.get("origin") || "https://jemwnyrrjuffecuwntzw.lovable.ai";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscriber.stripe_customer_id,
      return_url: baseUrl,
    });
    
    // Return the portal URL
    return new Response(
      JSON.stringify({ url: portalSession.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating customer portal:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
