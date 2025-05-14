
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";
import { corsHeaders } from "../_shared/cors.ts";

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Utility function for consistent logging
const logStep = (step: string, details?: any) => {
  const detailsString = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsString}`);
};

Deno.serve(async (req) => {
  // Handle CORS pre-flight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Get current user from JWT
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      logStep("Unauthorized - No auth header");
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
      logStep("Invalid token", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    logStep("User authenticated", { userId, email: user.email });

    // Get subscription status from subscribers table
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscribers")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      logStep("Error fetching subscription data", { error: subscriptionError });
    }

    // Also get the user's points
    const { data: statsData, error: statsError } = await supabase
      .from("user_statistics")
      .select("points")
      .eq("user_id", userId)
      .single();
    
    if (statsError && statsError.code !== 'PGRST116') {
      logStep("Error fetching user statistics", { error: statsError });
    }

    // Check if subscription is active based on end date
    let isActive = false;
    let subscriptionEndDate = null;
    let pointsEarnedToday = 0;
    let wasUpgraded = false;
    
    if (subscriptionData) {
      isActive = subscriptionData.subscribed;
      subscriptionEndDate = subscriptionData.subscription_end;
      pointsEarnedToday = subscriptionData.points_earned_today || 0;

      // Also check if subscription has expired
      if (subscriptionData.subscription_end) {
        const endDate = new Date(subscriptionData.subscription_end);
        const now = new Date();
        if (endDate < now) {
          logStep("Subscription expired", { endDate });
          isActive = false;
          
          // Update subscription record to mark as inactive
          if (subscriptionData.subscribed) {
            try {
              await supabase
                .from("subscribers")
                .update({
                  subscribed: false,
                  updated_at: now.toISOString()
                })
                .eq("user_id", userId);
                
              logStep("Marked expired subscription as inactive");
            } catch (err) {
              logStep("Error updating expired subscription", { error: err.message });
            }
          }
        }
      }

      // Reset daily points if last reset was more than 24 hours ago
      if (subscriptionData.last_points_reset) {
        const lastReset = new Date(subscriptionData.last_points_reset);
        const now = new Date();
        const hoursDifference = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        
        if (hoursDifference >= 24) {
          // Reset points_earned_today to 0
          try {
            await supabase
              .from("subscribers")
              .update({
                points_earned_today: 0,
                last_points_reset: now.toISOString(),
              })
              .eq("user_id", userId);
            
            pointsEarnedToday = 0;
            logStep("Reset daily points counter", { userId });
          } catch (err) {
            logStep("Error resetting daily points", { error: err.message });
          }
        }
      }
    } else {
      // User does not have a subscription record yet, check if we need to create one
      // This could be from URL parameters after checkout
      const url = new URL(req.url);
      const success = url.searchParams.get('success');
      const sessionId = url.searchParams.get('session_id');
      
      if (success === 'true' && sessionId) {
        logStep("Successful checkout detected", { sessionId });
        
        // TODO: Validate with Stripe API
        // For now, we'll create a premium subscription
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 30); // 30 days subscription
        
        try {
          await supabase
            .from("subscribers")
            .insert({
              user_id: userId,
              email: user.email,
              subscribed: true,
              subscription_tier: "premium",
              subscription_end: endDate.toISOString(),
              points_earned_today: 0,
              last_points_reset: now.toISOString()
            });
            
          isActive = true;
          subscriptionEndDate = endDate.toISOString();
          wasUpgraded = true;
          logStep("Created new subscription from checkout", { userId, endDate });
          
          // Add 200 bonus points for new premium subscription
          const currentPoints = statsData?.points || 0;
          const newPoints = currentPoints + 200;
          
          await supabase
            .from("user_statistics")
            .update({ 
              points: newPoints,
              updated_at: now.toISOString() 
            })
            .eq("user_id", userId);
            
          logStep("Added 200 bonus points for new premium subscription", { userId, newPoints });
        } catch (err) {
          logStep("Error creating subscription from checkout", { error: err.message });
        }
      }
    }

    const userPoints = statsData?.points || 0;
    
    logStep("Returning subscription data", { 
      subscribed: isActive, 
      subscription_tier: isActive ? "premium" : null,
      subscription_end: subscriptionEndDate, 
      points: userPoints,
      wasUpgraded
    });

    return new Response(
      JSON.stringify({
        subscribed: isActive,
        subscription_tier: isActive ? "premium" : null,
        subscription_end: subscriptionEndDate,
        points_earned_today: pointsEarnedToday,
        points: userPoints,
        was_upgraded: wasUpgraded
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    logStep("Error checking subscription", { error: error.message, stack: error.stack });
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
