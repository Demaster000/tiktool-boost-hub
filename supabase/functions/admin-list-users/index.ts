
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
      console.error("Failed to parse request body:", e);
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { user_ids } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'User IDs array is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`Fetching details for ${user_ids.length} users`);
    
    // Process in batches of 10 users to avoid timeouts
    const BATCH_SIZE = 10;
    const userDetails = [];
    
    for (let i = 0; i < user_ids.length; i += BATCH_SIZE) {
      const batchIds = user_ids.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i/BATCH_SIZE + 1}, users ${i+1}-${Math.min(i+BATCH_SIZE, user_ids.length)}`);
      
      // Use Promise.all to fetch multiple users in parallel
      const batchPromises = batchIds.map(async (userId: string) => {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError) {
          console.error(`Error fetching user ${userId}:`, userError);
          return null;
        }
        
        return {
          id: userData.user.id,
          email: userData.user.email,
          last_sign_in_at: userData.user.last_sign_in_at,
          created_at: userData.user.created_at,
          banned: userData.user.banned
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      userDetails.push(...batchResults.filter(user => user !== null));
    }

    return new Response(JSON.stringify(userDetails), {
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
