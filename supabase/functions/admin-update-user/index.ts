
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if user is admin
    const isAdmin = ADMIN_USER_IDS.includes(user.id);

    // Additional check from database if needed
    if (!isAdmin) {
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .single();
        
      if (adminError || !adminData) {
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
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log("Received admin update request:", body);
    
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
      console.log(`Setting ban status to ${ban} for user ${targetUserId}`);
      
      const { data: banData, error: banError } = await supabase.auth.admin.updateUserById(
        targetUserId, 
        { 
          ban_duration: ban ? 'forever' : 'none'
        }
      );
      
      if (banError) {
        console.error("Error updating user ban status:", banError);
        throw banError;
      }
      
      responseData = { ...responseData, banUpdated: true, banData };
    }

    // Update user points
    if (update_points && points !== undefined) {
      console.log(`Updating points to ${points} for user ${targetUserId}`);
      
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_statistics')
        .update({ points })
        .eq('user_id', targetUserId);
      
      if (pointsError) {
        console.error("Error updating user points:", pointsError);
        throw pointsError;
      }
      
      responseData = { ...responseData, pointsUpdated: true };
    }
    
    // Update premium status
    if (update_premium && premium !== undefined) {
      console.log(`Setting premium status to ${premium} for user ${targetUserId}`);
      
      // Check if subscription record exists
      const { data: existingSub, error: existingSubError } = await supabase
        .from('subscribers')
        .select('id')
        .eq('user_id', targetUserId)
        .single();
      
      let premiumData;
      
      if (existingSubError && existingSubError.code !== 'PGRST116') {
        console.error("Error checking existing subscription:", existingSubError);
        throw existingSubError;
      }

      if (existingSub) {
        // Update existing record
        const { data, error: updateError } = await supabase
          .from('subscribers')
          .update({
            subscribed: premium,
            subscription_tier: premium ? 'premium' : null,
            subscription_end: premium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', targetUserId);
        
        if (updateError) {
          console.error("Error updating subscription status:", updateError);
          throw updateError;
        }
        
        premiumData = data;
      } else if (premium) { 
        // Insert new record only if setting to premium
        const { data, error: insertError } = await supabase
          .from('subscribers')
          .insert({
            user_id: targetUserId,
            subscribed: true,
            subscription_tier: 'premium',
            subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        
        if (insertError) {
          console.error("Error creating subscription:", insertError);
          throw insertError;
        }
        
        premiumData = data;
      }
      
      responseData = { ...responseData, premiumUpdated: true, premiumData };
    }

    // Mark the operation as successful if we made it this far
    responseData.success = true;

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
