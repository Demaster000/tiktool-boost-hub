
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
    } catch {
      body = {};
    }
    
    const userIds = body.user_ids || [];

    if (!userIds.length) {
      return new Response(JSON.stringify({ error: 'No user IDs provided' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get user data
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw authError;
    }
    
    // Filter users by provided IDs and extract needed fields
    const filteredUsers = authUsers.users
      .filter(authUser => userIds.includes(authUser.id))
      .map(user => ({
        id: user.id,
        email: user.email,
        last_sign_in_at: user.last_sign_in_at,
        banned: user.banned
      }));

    return new Response(JSON.stringify(filteredUsers), {
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
