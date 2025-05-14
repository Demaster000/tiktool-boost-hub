
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.4.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with the service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// We'll use a list of admin user IDs to verify permissions
const ADMIN_USER_IDS = [
  "00000000-0000-0000-0000-000000000000", // Replace with actual admin UUIDs
  "47ae5fa0-2226-4ef3-817c-16697bde836a", // bielhenrique2@gmail.com
];

// Utility function for consistent logging
const logStep = (step: string, details?: any) => {
  const detailsString = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-UPDATE-USER] ${step}${detailsString}`);
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Get JWT token from request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Verify user is logged in
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      logStep("Invalid token error", { error: userError?.message });
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    logStep("User authenticated", { userId: user.id });

    // Check if user is admin
    const isAdmin = ADMIN_USER_IDS.includes(user.id);
    logStep("Admin check", { isAdmin, userId: user.id });

    // Additional check from database if needed
    if (!isAdmin) {
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .single();
        
      if (adminError || !adminData) {
        logStep("Unauthorized admin access attempt", { userId: user.id });
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      logStep("Invalid JSON body", { error: e.message });
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    logStep("Received admin update request", body);
    
    const { user_id: targetUserId, ban, update_points, points, update_premium, premium } = body;

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    let responseData = { success: false };

    // Update user ban status
    if (ban !== undefined) {
      logStep(`Setting ban status to ${ban} for user ${targetUserId}`);
      
      const { data: banData, error: banError } = await supabase.auth.admin.updateUserById(
        targetUserId, 
        { 
          ban_duration: ban ? 'forever' : 'none'
        }
      );
      
      if (banError) {
        logStep("Error updating user ban status", { error: banError });
        throw banError;
      }
      
      responseData = { ...responseData, banUpdated: true, banData };
    }

    // Update user points
    if (update_points && points !== undefined) {
      logStep(`Updating points to ${points} for user ${targetUserId}`);
      
      // First check if user_statistics record exists
      const { data: existingStats, error: statsError } = await supabase
        .from('user_statistics')
        .select('user_id')
        .eq('user_id', targetUserId)
        .single();
      
      if (statsError && statsError.code !== 'PGRST116') {
        logStep("Error checking user statistics", { error: statsError });
        throw statsError;
      }
      
      let updateResult;
      
      if (existingStats) {
        // Update existing record
        const { data: pointsData, error: pointsError } = await supabase
          .from('user_statistics')
          .update({ 
            points,
            updated_at: new Date().toISOString() 
          })
          .eq('user_id', targetUserId);
        
        if (pointsError) {
          logStep("Error updating user points", { error: pointsError });
          throw pointsError;
        }
        
        updateResult = pointsData;
        logStep("Points update successful", { user_id: targetUserId, points });
      } else {
        // Create new record if doesn't exist (shouldn't happen normally)
        const { data: pointsData, error: pointsError } = await supabase
          .from('user_statistics')
          .insert({ 
            user_id: targetUserId,
            points,
            followers_gained: 0,
            ideas_generated: 0,
            analyses_completed: 0,
            videos_shared: 0,
            daily_challenges_completed: 0
          });
        
        if (pointsError) {
          logStep("Error creating user statistics", { error: pointsError });
          throw pointsError;
        }
        
        updateResult = pointsData;
        logStep("New user statistics record created with points", { user_id: targetUserId, points });
      }
      
      responseData = { ...responseData, pointsUpdated: true };
    }
    
    // Update premium status
    if (update_premium && premium !== undefined) {
      logStep(`Setting premium status to ${premium} for user ${targetUserId}`);
      
      // Check if subscription record exists
      const { data: existingSub, error: existingSubError } = await supabase
        .from('subscribers')
        .select('id')
        .eq('user_id', targetUserId)
        .single();
      
      let premiumData;
      
      if (existingSubError && existingSubError.code !== 'PGRST116') {
        logStep("Error checking existing subscription", { error: existingSubError });
        throw existingSubError;
      }

      const subscriptionEnd = premium 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        : null;
      
      if (existingSub) {
        // Update existing record
        const { data, error: updateError } = await supabase
          .from('subscribers')
          .update({
            subscribed: premium,
            subscription_tier: premium ? 'premium' : null,
            subscription_end: subscriptionEnd,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', targetUserId);
        
        if (updateError) {
          logStep("Error updating subscription status", { error: updateError });
          throw updateError;
        }
        
        premiumData = data;
        logStep("Updated subscription record", { user_id: targetUserId, premium, subscription_end: subscriptionEnd });
      } else if (premium) { 
        // Insert new record only if setting to premium
        const { data, error: insertError } = await supabase
          .from('subscribers')
          .insert({
            user_id: targetUserId,
            subscribed: true,
            subscription_tier: 'premium',
            subscription_end: subscriptionEnd
          });
        
        if (insertError) {
          logStep("Error creating subscription", { error: insertError });
          throw insertError;
        }
        
        premiumData = data;
        logStep("Created new subscription record", { user_id: targetUserId, premium, subscription_end: subscriptionEnd });
        
        // If new premium subscription, add bonus points (200)
        try {
          const { data: statsData, error: statsError } = await supabase
            .from('user_statistics')
            .select('points')
            .eq('user_id', targetUserId)
            .single();
            
          if (statsError && statsError.code !== 'PGRST116') {
            throw statsError;
          }
          
          const currentPoints = statsData?.points || 0;
          const newPoints = currentPoints + 200;
          
          const { error: pointsError } = await supabase
            .from('user_statistics')
            .update({ 
              points: newPoints,
              updated_at: new Date().toISOString() 
            })
            .eq('user_id', targetUserId);
            
          if (pointsError) throw pointsError;
          
          logStep("Added 200 bonus points for new premium subscription", { user_id: targetUserId, newPoints });
        } catch (err) {
          logStep("Warning: Could not add bonus points for premium", { error: err.message });
          // Don't fail the entire operation for this
        }
      }
      
      responseData = { ...responseData, premiumUpdated: true, premiumData };
    }

    // Mark the operation as successful if we made it this far
    responseData.success = true;
    logStep("Operation completed successfully", responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    logStep('Error:', { message: error.message, stack: error.stack });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
