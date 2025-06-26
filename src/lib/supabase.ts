import { createClient } from '@supabase/supabase-js';
import { InvestmentStatus } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type DocumentType = 'pitch_deck' | 'ppm' | 'wire_instructions' | 'subscription_agreement' | 'promissory_note';
export type VerificationStatus = 'pending' | 'verified';
export type UserRole = 'user' | 'sub_admin' | 'admin'; 

// Fix circular reference by implementing the function here
export const createOrUpdateDocumentSignature = async (
  applicationId: string,
  documentType: string,
  status: string = 'pending',
  sendAdminNotification: boolean = true,
  autoComplete: boolean = true
): Promise<any> => {
  try {
    // Check if a document signature record already exists
    const { data: existingSignature, error: checkError } = await supabase
      .from('document_signatures')
      .select('id')
      .eq('application_id', applicationId)
      .eq('document_type', documentType)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    
    let signatureData;
    
    if (existingSignature) {
      // Update existing signature record
      const { data, error } = await supabase
        .from('document_signatures')
        .update({
          status: status,
          signed_at: status.includes('signed') ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSignature.id)
        .select()
        .single();
        
      if (error) throw error;
      signatureData = data;
    } else {
      // Create new signature record
      const { data, error } = await supabase
        .from('document_signatures')
        .insert({
          application_id: applicationId,
          document_type: documentType,
          status: status,
          signed_at: status.includes('signed') ? new Date().toISOString() : null,
          document_url: null, // Will be populated by SignRequest integration
          signing_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      signatureData = data;
    }
    
    // Auto-complete application status update if requested
    if (autoComplete && status === 'investor_signed') {
      if (documentType === 'subscription_agreement') {
        await update_application_onboarding_status(applicationId, 'documents_signed');
      } else if (documentType === 'promissory_note') {
        await update_application_onboarding_status(applicationId, 'bank_details_pending');
      }
    }
    
    // Send notification to admin if requested
    if (sendAdminNotification && status === 'investor_signed') {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-admin-notification`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              applicationId,
              document_type: documentType,
              notificationType: `${documentType}_signed`,
              message: `Investor has signed the ${documentType.replace('_', ' ')} for application ${applicationId}`
            }),
          }
        );
      } catch (error) {
        console.error('Error sending admin notification:', error);
        // Don't fail the whole operation if notification sending fails
      }
    }
    
    return signatureData;
  } catch (error) {
    console.error('Error creating/updating document signature:', error);
    throw error;
  }
};

// Add a simple wrapper for legacy code
export const createDocumentSignature = async (
  applicationId: string,
  documentType: string,
  status: string
) => {
  return createOrUpdateDocumentSignature(applicationId, documentType, status);
};
export type InvestmentStatus = 'pending' | 'pending_approval' | 'pending_activation' | 'plaid_pending' | 
  'investor_onboarding_complete' | 'active' | 'completed' | 'cancelled' | 'promissory_note_pending' | 
  'promissory_note_sent' | 'funds_pending' | 'bank_details_pending';

export interface DocumentRequest {
  id: string;
  user_id: string;
  document_type: DocumentType;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
}
export interface AdminNotification {
  id: string;
  application_id?: string;
  document_type?: string;
  user_id?: string;
  user_email: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}


export interface ConsultationRequest {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  suggested_investment_amount?: number;
  preferred_date?: string;
  preferred_time?: string;
  consultation_type: 'video' | 'phone';
  notes?: string;
  status: ConsultationStatus;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface SignedDocument {
  id: string;
  document_type: string;
  application_id: string;
  status: string;
  document_url: string;
  signed_at: string | null;
  created_at: string;
}

export interface UserProfile {
  id?: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  ira_accounts?: string;
  investment_goals?: string;
  risk_tolerance?: string;
  net_worth?: string;
  annual_income?: string;
  admin_notes?: string[];
  created_at?: string;
  updated_at?: string;
}

export const checkVerificationStatus = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'pending' as VerificationStatus;

  const { data } = await supabase
    .from('users')
    .select('verification_status')
    .eq('id', user.id)
    .maybeSingle();

  return (data ? data.verification_status || 'pending' : 'pending') as VerificationStatus;
};

export const requestDocument = async (documentType: DocumentType) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check for existing request
  const { data: existingRequest, error: checkError } = await supabase
    .from('document_requests')
    .select('*')
    .eq('user_id', user.id)
    .eq('document_type', documentType)
    .or('status.eq.approved,status.eq.pending')
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existingRequest) {
    return {
      status: existingRequest.status,
      message: existingRequest.status === 'approved' 
        ? 'You already have access to this document.'
        : 'You have a pending request for this document.'
    };
  }

  // Create new request
  const { data, error: insertError } = await supabase
    .from('document_requests')
    .insert([
      {
        user_id: user.id,
        document_type: documentType,
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (insertError) throw insertError;
  return { status: 'new', message: 'Request submitted successfully.' };
};

export const checkUserRole = async (): Promise<UserRole> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'user';

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return (data?.role || 'user') as UserRole;
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return data;
};

export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return data;
};

export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = profile.user_id || (user ? user.id : null);
  if (!userId) return null;

  try {
    // First update the auth metadata to ensure first_name and last_name are stored there
    if (profile.first_name || profile.last_name) {
      await supabase.rpc('update_user_metadata', {
        p_first_name: profile.first_name,
        p_last_name: profile.last_name
      });
    }

    // Then update the user profile
    const { data, error } = await supabase.rpc('safe_upsert_user_profile', {
      p_user_id: userId,
      p_first_name: profile.first_name,
      p_last_name: profile.last_name,
      p_phone: profile.phone,
      p_address: profile.address,
      p_ira_accounts: profile.ira_accounts,
      p_investment_goals: profile.investment_goals,
      p_risk_tolerance: profile.risk_tolerance,
      p_net_worth: profile.net_worth,
      p_annual_income: profile.annual_income
    });

    if (error) throw error;
    
    return await getUserProfile();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.rpc('get_all_users');
  
  if (error) throw error;
  return data || [];
};

export const setUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const { error } = await supabase.rpc('set_user_role', {
    target_user_id: userId,
    new_role: role
  });
  
  if (error) throw error;
};

export const updateUserVerification = async (userId: string, status: VerificationStatus): Promise<void> => {
  const { error } = await supabase.rpc('update_user_verification', {
    p_user_id: userId,
    p_status: status
  });
  
  if (error) throw error;
};

export const createConsultationRequest = async (data: {
  name: string;
  email: string;
  phone?: string;
  suggested_investment_amount?: number;
  preferred_date?: string;
  preferred_time?: string;
  consultation_type: 'video' | 'phone';
  notes?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: result, error } = await supabase
    .from('consultation_requests')
    .insert([{
      user_id: user.id,
      ...data,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const createInvestmentApplication = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('create_investment_application');
  
  if (error) throw error;
  return data;
};

export const createInvestmentApplicationWithDetails = async (
  investmentAmount: number,
  annualPercentage: number,
  paymentFrequency: string,
  termMonths: number
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('create_investment_application', {
    p_investment_amount: investmentAmount,
    p_annual_percentage: annualPercentage,
    p_payment_frequency: paymentFrequency,
    p_term_months: termMonths
  });
  
  if (error) throw error;
  return data;
};

export const move_investment_to_bank_details_stage = async (
  investmentId: string
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('move_investment_to_bank_details_stage', {
      p_investment_id: investmentId
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error moving investment to bank details stage:', error);
    throw error;
  }
};

export const get_investment_application_by_id = async (applicationId: string): Promise<any> => {
  const { data, error } = await supabase.rpc('get_investment_application_by_id', {
    p_application_id: applicationId
  });
  
  if (error) throw error;
  return data?.[0] || null;
};

export const update_application_onboarding_status = async (
  applicationId: string,
  newStatus: string
): Promise<void> => {
  const { error } = await supabase.rpc('update_application_onboarding_status', {
    p_application_id: applicationId,
    p_new_status: newStatus
  });
  
  if (error) throw error;
};

export const getUserActiveApplication = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase.rpc('get_user_active_application');
  
  if (error) throw error;
  return data?.[0] || null;
};

export const getUserLatestPendingApplication = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Query for the latest application that is not in a final state
  const { data, error } = await supabase
    .from('investment_applications')
    .select('*')
    .eq('user_id', user.id)
    .not('status', 'in', '(active,rejected)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

export const subscribeToNewsletter = async (email: string) => {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('This email is already subscribed to our newsletter.');
    }
    throw error;
  }
  return data;
};

export const getAllConsultationRequests = async (): Promise<ConsultationRequest[]> => {
  const { data, error } = await supabase
    .from('consultation_requests')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getAllNewsletterSubscribers = async (): Promise<NewsletterSubscriber[]> => {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const getUserSignedDocuments = async (): Promise<SignedDocument[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  // Call get_latest_user_documents to only get the latest version of each document type
  const { data, error } = await supabase.rpc('get_latest_user_documents', {
    p_user_id: user.id
  }); 
  
  if (error) throw error;
  return data || [];
};

export const user_has_active_investments = async (userId: string): Promise<boolean> => {
  try {
    // First check direct investments
    const { data: investments, error: invError } = await supabase
      .from('investments')
      .select('status, application_id')
      .eq('user_id', userId);
      
    if (invError) throw invError;
    
    if (investments && investments.length > 0) {
      // Check if any investment is in an active state
      const activeInvestment = investments.find(inv => 
        !['cancelled', 'deleted'].includes(inv.status)
      );
      
      if (activeInvestment) {
        return true;
      }
    }
    
    // If no active investments directly, check applications
    const { data: applications, error: appError } = await supabase
      .from('investment_applications')
      .select('id, status')
      .eq('user_id', userId);
      
    if (appError) throw appError;
    
    if (applications && applications.length > 0) {
      // Check if any application is in an active state
      const activeApp = applications.find(app => 
        ![
          'rejected', 
          'deleted', 
          'cancelled'
        ].includes(app.status)
      );
      
      return !!activeApp;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking active investments:', error);
    return false;
  }
};

export const get_user_investments_with_applications = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase.rpc('get_user_investments_with_applications', {
    p_user_id: userId
  });
  
  if (error) throw error;
  return data || [];
};

export const get_admin_investments_with_users = async (): Promise<any[]> => {
  const { data, error } = await supabase.rpc('get_admin_investments_with_users');
  
  if (error) throw error;
  return data || [];
};

// Function to send promissory note and automatically complete step
export const adminSendPromissoryNote = async (
  applicationId: string
): Promise<string> => {
  try {
    // Directly create document signature with auto-complete=true
    const { data, error } = await supabase.rpc('get_user_active_application');
      
    if (error) throw error;
    
    // No need to manually update status - the function handles it
    return data;
  } catch (error) {
    console.error('Error sending promissory note:', error);
    throw error;
  }
};

// Function to move directly to bank details stage (skipping "Complete Step 2")
export const moveToNextStageAutomatically = async (
  applicationId: string,
  newStatus: string = 'bank_details_pending'
): Promise<void> => {
  try {
    // Simply update the application status directly
    const { error } = await supabase.rpc('update_application_onboarding_status', {
      p_application_id: applicationId,
      p_new_status: newStatus
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error moving to next stage:', error);
    throw error;
  }
};

export const getAdminNotifications = async (limit = 10, offset = 0): Promise<AdminNotification[]> => {
  const { data, error } = await supabase.rpc('get_admin_notifications', {
    p_limit: limit,
    p_offset: offset
  });
  
  if (error) throw error;
  return data || [];
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('get_unread_notification_count');
  
  if (error) throw error;
  return data || 0;
};

export const claimUserByAdmin = async (userId: string, adminId?: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  const adminIdToUse = adminId || user?.id;
  
  if (!adminIdToUse) throw new Error('No admin ID provided and no user logged in');
  
  const { error } = await supabase.rpc('claim_user_by_admin', {
    p_user_id: userId,
    p_admin_id: adminIdToUse
  });
  
  if (error) throw error;
};

export const unclaim_user = async (userId: string): Promise<void> => {
  const { error } = await supabase.rpc('unclaim_user', {
    p_user_id: userId
  });
  
  if (error) throw error;
};

export const assignUserToAdmin = async (userId: string, adminId: string): Promise<void> => {
  const { error } = await supabase.rpc('assign_user_to_admin', {
    p_user_id: userId,
    p_admin_id: adminId
  });
  
  if (error) throw error;
};

export const getAllAdmins = async (): Promise<{id: string, email: string, first_name: string, last_name: string, role: string}[]> => {
  const { data, error } = await supabase.rpc('get_all_admins');
  
  if (error) throw error;
  return data || [];
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase.rpc('mark_notification_read', {
    p_notification_id: notificationId
  });
  
  if (error) throw error;
};

export const getAdminSigningUrl = async (signatureId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('get_admin_signing_url', {
    p_signature_id: signatureId
  });
  
  if (error) throw error;
  return data;
};

export const getAdminDocumentSignatures = async (): Promise<DocumentRequest[]> => {
  const { data, error } = await supabase
    .from('document_signatures')
    .select(`
      id,
      application_id,
      document_type,
      status,
      document_url,
      signed_at,
      created_at,
      assigned_admin_id,
      investment_applications!inner(
        id,
        user_id,
        status,
        investment_amount
      ),
      users!investment_applications(
        id,
        email,
        first_name,
        last_name
      )
    `)
    .eq('status', 'investor_signed')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Format the data for the admin dashboard
  return data.map((doc: any) => ({
    id: doc.id,
    application_id: doc.application_id,
    user_id: doc.investment_applications.user_id,
    user_email: doc.users[0].email,
    user_name: `${doc.users[0].first_name} ${doc.users[0].last_name}`,
    document_type: doc.document_type,
    status: doc.status,
    signed_at: doc.signed_at,
    created_at: doc.created_at,
    assigned_admin_id: doc.assigned_admin_id,
    document_url: doc.document_url
  }));
};

export const getManagedUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.rpc('get_managed_users_with_admin_details');
  if (error) throw error;
  return data || [];
};

export const handleInvestorSignedDocument = async (signatureId: string): Promise<void> => {
  const { error } = await supabase.rpc('handle_investor_signed_document', {
    p_signature_id: signatureId
  });
  
  if (error) throw error;
};

export const assignDocumentToAdmin = async (signatureId: string, adminId?: string): Promise<void> => {
  const { error } = await supabase.rpc('assign_document_to_admin', {
    p_signature_id: signatureId,
    p_admin_id: adminId
  });
  
  if (error) throw error;
};

export const updateConsultationStatus = async (id: string, status: ConsultationStatus) => {
  const { error } = await supabase
    .from('consultation_requests')
    .update({ status })
    .eq('id', id);
  
  if (error) throw error;
};

export const updateInvestmentStatus = async (
  investmentId: string,
  newStatus: 'active' | 'pending' | 'completed' | 'cancelled'
): Promise<void> => {
  try {
    // First update the investment directly
    const { error } = await supabase
      .from('investments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', investmentId);
    
    if (error) throw error;
    
    // Then get the investment to check if it has an application_id
    const { data: investment } = await supabase
      .from('investments')
      .select('application_id, user_id')
      .eq('id', investmentId)
      .single();
      
    // If it has an application_id, update the application status too
    if (investment?.application_id) {
      let appStatus;
      if (newStatus === 'active') {
        appStatus = 'active';
      } else if (newStatus === 'cancelled') {
        appStatus = 'rejected';
      } else if (newStatus === 'promissory_note_pending') {
        appStatus = 'promissory_note_pending';
      } else if (newStatus === 'funds_pending') {
        appStatus = 'funds_pending';
      } else {
        appStatus = 'documents_signed'; // Default fallback
      }
      
      const { error: appError } = await supabase
        .from('investment_applications')
        .update({ status: appStatus })
        .eq('id', investment.application_id);
        
      if (appError) {
        console.error('Error updating application status:', appError);
        // Don't throw here, as the investment was already updated
      }
    }
  } catch (error) {
    console.error('Error updating investment status:', error);
    throw error;
  }
};

export const updateInvestmentDetails = async (
  investmentId: string,
  amount: number,
  annualPercentage: number,
  paymentFrequency: string,
  termMonths: number
): Promise<void> => {
  const { error } = await supabase
    .from('investments')
    .update({
      amount,
      annual_percentage: annualPercentage,
      payment_frequency: paymentFrequency,
      term_months: termMonths,
      updated_at: new Date().toISOString()
    })
    .eq('id', investmentId);
  
  if (error) throw error;
};

export const createPromissoryNoteSignatureRecord = async (
  applicationId: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('create_promissory_note_signature_record', {
    p_application_id: applicationId
  });
  
  if (error) throw error;
  return data;
};

export const sendSystemNotificationToUser = async (
  recipientUserId: string,
  subject: string,
  content: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('send_system_notification_to_user', {
    p_recipient_user_id: recipientUserId,
    p_subject: subject,
    p_content: content
  });
  
  if (error) throw error;
  return data;
};

export const getUserInvestments = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('investments')
    .select('*, investment_applications(id, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const addAdminNote = async (userId: string, note: string): Promise<void> => {
  const { error } = await supabase.rpc('add_admin_note', {
    p_user_id: userId,
    p_note: note
  });
  
  if (error) throw error;
};

export const deleteConsultationRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase
    .from('consultation_requests')
    .delete()
    .eq('id', requestId);
  
  if (error) throw error;
};

export const deleteAdminNotification = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('admin_notifications')
    .delete()
    .eq('id', notificationId);
  
  if (error) throw error;
};

export const deleteUserAndAllData = async (userId: string): Promise<void> => {
  const { error } = await supabase.rpc('delete_user_and_all_data', {
    p_user_id: userId
  });
  
  if (error) throw error;
};

// Helper function to check if all investments for a user are cancelled or deleted
export const areAllUserInvestmentsCancelled = async (userId: string): Promise<boolean> => {
  try {
    // First check direct investments
    const { data: investments, error: invError } = await supabase
      .from('investments')
      .select('status, application_id')
      .eq('user_id', userId);
      
    if (invError) throw invError;
    
    // If no investments, technically "all are cancelled"
    if (!investments || investments.length === 0) {
      return true;
    }
    
    // Check if all investments are cancelled/deleted
    const allCancelled = investments.every(inv => 
      ['cancelled', 'deleted'].includes(inv.status)
    );
    
    if (!allCancelled) {
      return false;
    }
    
    // Also check applications
    const appIds = investments
      .filter(inv => inv.application_id)
      .map(inv => inv.application_id);
      
    if (appIds.length > 0) {
      const { data: applications, error: appError } = await supabase
        .from('investment_applications')
        .select('status')
        .in('id', appIds);
        
      if (appError) throw appError;
      
      // Make sure all applications are also in terminal states
      if (applications && applications.length > 0) {
        return applications.every(app => 
          ['rejected', 'deleted', 'cancelled'].includes(app.status)
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking if investments are cancelled:', error);
    return false;
  }
};

// Function to update investment to promissory note stage
export const moveInvestmentToPromissoryNoteStage = async (
  investmentId: string
): Promise<void> => {
  try {
    // Update the investment status to promissory_note_sent instead of promissory_note_pending
    await updateInvestmentStatus(investmentId, 'promissory_note_sent' as InvestmentStatus);
    
    // Get application ID and user ID from the investment
    const { data: investment } = await supabase
      .from('investments')
      .select('application_id, user_id')
      .eq('id', investmentId)
      .single();
      
    if (investment?.application_id && investment?.user_id) {
      // Update application status
      const { error: appError } = await supabase
        .from('investment_applications')
        .update({ 
          status: 'promissory_note_pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', investment.application_id);
        
      if (appError) console.error('Error updating application:', appError);
      
      // Create promissory note signature record
      await createPromissoryNoteSignatureRecord(investment.application_id);
      
      // Send detailed notification to user about next step
      await sendSystemNotificationToUser(
        investment.user_id,
        'Promissory Note Created: Action Required (Step 1 of 3)',
        'Your promissory note has been created and is ready for your signature. Please log in to your dashboard to sign the document to complete Step 1 of 3 in your investment process.'
      );
    }
  } catch (error) {
    console.error('Error moving investment to promissory note stage:', error);
    throw error;
  }
};

// Function to update investment to verify signed promissory note
export const verifyPromissoryNoteSigned = async (
  investmentId: string
): Promise<void> => {
  try {
    // Update the investment status
    await updateInvestmentStatus(investmentId, 'plaid_pending' as InvestmentStatus);
    
    // Get the investment details
    const { data: investment } = await supabase
      .from('investments')
      .select('application_id, user_id')
      .eq('id', investmentId)
      .single();
      
    if (investment?.application_id && investment?.user_id) {
      // Update application status to plaid_pending (skipping bank_details_pending)
      const { error: appError } = await supabase
        .from('investment_applications')
        .update({ 
          status: 'plaid_pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', investment.application_id);
        
      if (appError) console.error('Error updating application status:', appError);
      
      // Send notification to user
      await sendSystemNotificationToUser(
        investment.user_id,
        'Promissory Note & Funds Verified - Next Step: Connect Bank',
        'Your signed promissory note and wire transfer have been verified. Please proceed to your dashboard to connect your bank account for future transactions.'
      );
    }
  } catch (error) {
    console.error('Error verifying promissory note signed:', error);
    throw error;
  }
};

// Function to update investment to funds pending stage
export const moveInvestmentToFundsPendingStage = async (
  investmentId: string
): Promise<void> => {
  try {
    // Update the investment status
    await updateInvestmentStatus(investmentId, 'funds_pending' as InvestmentStatus);
    
    // Get the user ID from the investment
    const { data: investment } = await supabase
      .from('investments')
      .select('user_id')
      .eq('id', investmentId)
      .single();
      
    // Send notification to user
    if (investment?.user_id) {
      await sendSystemNotificationToUser(
        investment.user_id, 
        'Wire Instructions Available: Action Required (Step 2 of 4)', 
        'We have received your signed promissory note. Please proceed to your dashboard to review wire transfer instructions and complete your investment by wire transfer.'
      );
    }
  } catch (error) {
    console.error('Error moving investment to funds pending stage:', error);
    throw error;
  }
};

// Function to confirm funds received and proceed to Plaid
export const confirmFundsReceivedAndProceedToPlaid = async (
  investmentId: string
): Promise<void> => {
  try {
    // Update the investment status to plaid_pending
    await updateInvestmentStatus(investmentId, 'plaid_pending');
    
    // Get the user ID from the investment
    const { data: investment } = await supabase
      .from('investments')
      .select('user_id')
      .eq('id', investmentId)
      .single();
      
    // Send notification to user
    if (investment?.user_id) {
      await sendSystemNotificationToUser(
        investment.user_id, 
        'Funds Received: Connect Your Bank Account (Step 3 of 4)', 
        'We have verified receipt of your wire transfer and your signed promissory note. Please proceed to your dashboard to connect your bank account for future transactions.'
      );
    }
  } catch (error) {
    console.error('Error confirming funds received:', error);
    throw error;
  }
};

// Function to activate investment after bank connection
export const activateInvestment = async (
  investmentId: string
): Promise<void> => {
  try {
    try {
      // Try to use the RPC function first
      const { error } = await supabase.rpc('activate_user_investment', {
        p_investment_id: investmentId
      });
      
      if (error) throw error;
    } catch (rpcError) {
      console.error('RPC error, falling back to direct update:', rpcError);
      // Fallback to direct update if RPC fails
      const { error } = await supabase
        .from('investments')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', investmentId);
        
      if (error) throw error;
      
      // Get the application ID from the investment
      const { data: investment, error: fetchError } = await supabase
        .from('investments')
        .select('application_id, user_id')
        .eq('id', investmentId)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update application status if it exists
      if (investment?.application_id) {
        const { error: appError } = await supabase
          .from('investment_applications')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', investment.application_id);
          
        if (appError) console.error('Error updating application:', appError);
      }
    }
    
    // Get the user ID and amount from the investment
    const { data: investment } = await supabase
      .from('investments')
      .select('user_id, amount')
      .eq('id', investmentId)
      .single();
      
    // Send notification to user
    if (investment?.user_id) {
      await sendSystemNotificationToUser(
        investment.user_id, 
        'Investment Successfully Activated!', 
        `Congratulations! Your bank connection has been verified and your investment of $${investment.amount.toLocaleString()} is now fully activated. Your returns will begin accruing immediately. Thank you for investing with Inner Circle Lending.`
      );
    }
  } catch (error) {
    console.error('Error confirming funds received:', error);
    throw error;
  }
};