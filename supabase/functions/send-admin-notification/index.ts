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

    const { applicationId, notificationType, message: customMessage } = await req.json();

    if (!applicationId || !notificationType) {
      throw new Error('Application ID is required');
    }

    // Validate the application ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    // Get application details first
    const { data: application, error: appError } = await supabaseClient
      .from('investment_applications')
      .select(`
        id,
        user_id,
        investment_amount,
        annual_percentage,
        payment_frequency,
        term_months
      `)
      .eq('id', applicationId)
      .single();

    if (appError) {
      throw new Error(`Application error: ${appError.message}`);
    }

    if (!application) {
      throw new Error('Application not found');
    }

    // Use custom message if provided, otherwise generate default message
    let notificationMessage = customMessage;
    
    // Get user details separately
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name
      `)
      .eq('id', application.user_id)
      .single();

    if (userError) {
      throw new Error(`User error: ${userError.message}`);
    }

    if (!user) {
      throw new Error('User not found');
    }

    if (!notificationMessage) {
      if (notificationType === 'investor_onboarding_complete') {
        notificationMessage = `${user.first_name} ${user.last_name} (${user.email}) has completed the investor onboarding process. It will now go through final review.`;
      } else if (notificationType === 'promissory_note_signed') {
        notificationMessage = `${user.first_name} ${user.last_name} (${user.email}) has signed their promissory note. Please review and sign the document.`;
      } else if (notificationType === 'wire_details_confirmed') {
        notificationMessage = `${user.first_name} ${user.last_name} (${user.email}) has confirmed wire details. Please review and approve.`;
      } else {
        notificationMessage = `Notification for application ${applicationId}: ${notificationType}`;
      }
    }

    // Create admin notification
    const { data: notification, error: notifError } = await supabaseClient
      .from('admin_notifications')
      .insert([{
        application_id: applicationId,
        user_id: user.id,
        user_email: user.email,
        message: notificationMessage,
        notification_type: notificationType,
        is_read: false
      }])
      .select()
      .single();

    if (notifError) {
      throw new Error(`Notification error: ${notifError.message}`);
    }
    
    // If this is a promissory note signature notification, immediately update application status
    if (notificationType === 'promissory_note_signed') {
      await supabaseClient
        .rpc('move_investment_to_bank_details_stage', { 
          p_application_id: applicationId 
        });
    }

    return new Response(
      JSON.stringify({ success: true, notification }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in send-admin-notification:', error);
    
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