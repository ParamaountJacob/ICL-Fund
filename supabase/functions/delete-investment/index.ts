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
      throw new Error('Only admins can delete investments');
    }

    // Get the investment ID from the request
    const { investmentId } = await req.json();
    
    if (!investmentId) {
      throw new Error('Investment ID is required');
    }

    // Get the investment to check if it exists and get related data
    const { data: investment, error: investmentError } = await supabaseClient
      .from('investments')
      .select('id, user_id, application_id')
      .eq('id', investmentId)
      .single();
      
    if (investmentError) {
      throw new Error(`Error fetching investment: ${investmentError.message}`);
    }
    
    if (!investment) {
      throw new Error('Investment not found');
    }

    // Delete related payments first
    const { error: paymentsError } = await supabaseClient
      .from('payments')
      .delete()
      .eq('investment_id', investmentId);
      
    if (paymentsError) {
      console.error('Error deleting payments:', paymentsError);
      // Continue with deletion even if payments deletion fails
    }

    // Delete the investment
    const { error: deleteError } = await supabaseClient
      .from('investments')
      .delete()
      .eq('id', investmentId);
      
    if (deleteError) {
      throw new Error(`Error deleting investment: ${deleteError.message}`);
    }

    // Log the activity
    await supabaseClient.from('user_activity').insert([{
      user_id: investment.user_id,
      action_type: 'investment_deleted',
      action_description: `Investment ${investmentId} was deleted by admin`,
      performed_by: user.id
    }]);

    return new Response(
      JSON.stringify({ success: true, message: 'Investment deleted successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in delete-investment:', error);
    
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