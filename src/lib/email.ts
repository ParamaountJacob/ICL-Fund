import { supabase } from './supabase';
import type { DocumentType } from './supabase';

interface EmailData {
  name: string;
  email: string;
  phone?: string;
  preferredDate?: string;
  preferredTime?: string;
  message?: string;
  documentType?: DocumentType;
}

export const sendEmail = async (data: EmailData) => {
  try {
    if (data.documentType) {
      const { data: { user } } = await supabase.auth.getUser(); 
      if (user) {
        const { data: request, error: requestError } = await supabase
          .from('document_requests')
          .insert([{
            user_id: user.id,
            document_type: data.documentType,
            status: 'pending'
          }])
          .select()
          .single();

        if (requestError) {
          throw requestError;
        }

        if (request) {
          // Generate approval link with secure token
          const approvalUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-document?requestId=${request.id}&token=${request.approval_token}`;
          data.message = `${data.message || ''}

Contact Information:
- Name: ${data.name}
- Email: ${data.email}
- Phone: ${data.phone || 'Not provided'}

Document Request Details:
- Type: ${data.documentType}

${data.preferredDate && data.preferredTime ? `
Preferred Meeting Time:
- Date: ${data.preferredDate}
- Time: ${data.preferredTime}
` : ''}

Click here to approve this request with one click:
${approvalUrl}

This link is secure and can only be used once.`;
        }
      } else {
        // Format message with contact info and scheduling
        data.message = `
Contact Information:
- Name: ${data.name}
- Email: ${data.email}
- Phone: ${data.phone || 'Not provided'}

${data.message ? `\nMessage:\n${data.message}\n` : ''}

${data.preferredDate && data.preferredTime ? `
Preferred Meeting Time:
- Date: ${data.preferredDate}
- Time: ${data.preferredTime}
Note: We will confirm the final meeting time via email.
` : ''}`;

        throw new Error('User not authenticated');
      }
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email. Please try again later.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
};