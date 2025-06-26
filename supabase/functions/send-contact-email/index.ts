import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@3.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const { name, email, phone, preferredDate, preferredTime, message } = await req.json();

    // Format the email content with all details
    const formattedMessage = `
New Contact Form Submission

Contact Information:
- Name: ${name}
- Email: ${email}
- Phone: ${phone || 'Not provided'}

${preferredDate && preferredTime ? `
Preferred Meeting Time:
- Date: ${preferredDate}
- Time: ${preferredTime}
` : ''}

${message ? `Message:\n${message}` : ''}
    `.trim();

    const { data, error } = await resend.emails.send({
      from: 'Inner Circle Lending <contact@innercirclelending.com>',
      to: ['innercirclelending@gmail.com'],
      subject: `New Contact Form Submission from ${name}`,
      text: formattedMessage,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (error) {
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