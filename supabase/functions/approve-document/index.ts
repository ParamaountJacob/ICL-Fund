import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

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

    const url = new URL(req.url);
    const requestId = url.searchParams.get('requestId');
    const token = url.searchParams.get('token');

    if (!requestId || !token) {
      throw new Error('Missing required parameters');
    }

    // Verify token and update status
    const { data: request, error: requestError } = await supabaseClient
      .from('document_requests')
      .select('*')
      .eq('id', requestId)
      .eq('approval_token', token)
      .eq('status', 'pending')
      .single();

    if (requestError || !request) {
      throw new Error('Invalid or expired request');
    }

    // Approve request and invalidate token
    const { error: updateError } = await supabaseClient
      .from('document_requests')
      .update({ 
        status: 'approved',
        approval_token: null // Clear token after use
      })
      .eq('id', requestId)
      .eq('approval_token', token);

    if (updateError) {
      throw updateError;
    }

    // Return success page
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Document Request Approved</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #030303;
              color: #F8F8F8;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              text-align: center;
              padding: 40px;
              background: #0C0C0E;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .success-icon {
              color: #D4AF37;
              font-size: 48px;
              margin-bottom: 24px;
            }
            h1 { margin-bottom: 16px; }
            p { color: #A1A1AA; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Document Request Approved</h1>
            <p>The document request has been successfully approved. The user will be notified and granted access to the requested document.</p>
          </div>
        </body>
      </html>
    `;

    return new Response(html, { 
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 200 
    });

  } catch (error) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #030303;
              color: #F8F8F8;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              text-align: center;
              padding: 40px;
              background: #0C0C0E;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .error-icon {
              color: #EF4444;
              font-size: 48px;
              margin-bottom: 24px;
            }
            h1 { margin-bottom: 16px; }
            p { color: #A1A1AA; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">×</div>
            <h1>Error</h1>
            <p>${error.message}</p>
          </div>
        </body>
      </html>
    `;

    return new Response(html, { 
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 400
    });
  }
});