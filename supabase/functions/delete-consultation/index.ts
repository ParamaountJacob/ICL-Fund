import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: userData, error: roleError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (roleError) {
      throw new Error('Error checking user role');
    }
    
    if (userData.role !== 'admin') {
      throw new Error('Only admins can delete consultation requests');
    }

    // Get the consultation request ID from the request
    const { requestId } = await req.json();
    
    if (!requestId) {
      throw new Error('Consultation request ID is required');
    }

    // Get the consultation request to check if it exists and get related data
    const { data: consultation, error: consultationError } = await supabaseClient
      .from('consultation_requests')
      .select('id, user_id')
      .eq('id', requestId)
      .single();
      
    if (consultationError) {
      throw new Error(`Error fetching consultation request: ${consultationError.message}`);
    }
    
    if (!consultation) {
      throw new Error('Consultation request not found');
    }

    // Delete the consultation request
    const { error: deleteError } = await supabaseClient
      .from('consultation_requests')
      .delete()
      .eq('id', requestId);
      
    if (deleteError) {
      throw new Error(`Error deleting consultation request: ${deleteError.message}`);
    }

    // Log the activity
    await supabaseClient.from('user_activity').insert([{
      user_id: consultation.user_id,
      action_type: 'consultation_deleted',
      action_description: `Consultation request ${requestId} was deleted by admin`,
      performed_by: user.id
    }]);

    return new Response(
      JSON.stringify({ success: true, message: 'Consultation request deleted successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in delete-consultation:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      },
    );
  }
});