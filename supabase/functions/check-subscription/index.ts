
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";
import { corsHeaders } from "../_shared/cors.ts";

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS pre-flight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get current user from JWT
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    const userId = user.id;

    // Get subscription status from subscribers table
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscribers")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Also get the user's points
    const { data: statsData, error: statsError } = await supabase
      .from("user_statistics")
      .select("points")
      .eq("user_id", userId)
      .single();

    // Check if subscription is active based on end date
    let isActive = false;
    let subscriptionEndDate = null;
    let pointsEarnedToday = 0;
    
    if (subscriptionData) {
      isActive = subscriptionData.subscribed;
      subscriptionEndDate = subscriptionData.subscription_end;
      pointsEarnedToday = subscriptionData.points_earned_today || 0;

      // Also check if subscription has expired
      if (subscriptionData.subscription_end) {
        const endDate = new Date(subscriptionData.subscription_end);
        const now = new Date();
        if (endDate < now) {
          isActive = false;
        }
      }

      // Reset daily points if last reset was more than 24 hours ago
      if (subscriptionData.last_points_reset) {
        const lastReset = new Date(subscriptionData.last_points_reset);
        const now = new Date();
        const hoursDifference = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        
        if (hoursDifference >= 24) {
          // Reset points_earned_today to 0
          await supabase
            .from("subscribers")
            .update({
              points_earned_today: 0,
              last_points_reset: now.toISOString(),
            })
            .eq("user_id", userId);
          
          pointsEarnedToday = 0;
        }
      }
    }

    const userPoints = statsData?.points || 0;

    return new Response(
      JSON.stringify({
        subscribed: isActive,
        subscription_tier: isActive ? "premium" : null,
        subscription_end: subscriptionEndDate,
        points_earned_today: pointsEarnedToday,
        points: userPoints,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking subscription:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        points_earned_today: 0,
        points: 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
