import { supabase } from './supabase';
import type { Lead, CRMActivity, CRMStats } from '../types/crm';

// Delete a CRM lead
export const deleteCrmLead = async (leadId: string): Promise<void> => {
  const { error } = await supabase.rpc('delete_crm_lead', {
    p_lead_id: leadId
  });

  if (error) throw error;
};

// Create a lead from consultation request
export const createLeadFromConsultation = async (consultationData: any): Promise<string> => {
  const leadData: Partial<Lead> = {
    name: consultationData.name,
    email: consultationData.email,
    phone: consultationData.phone,
    source: 'consultation',
    status: 'new',
    contact_origin: `${consultationData.consultation_type} consultation request`,
    investment_interest: consultationData.suggested_investment_amount,
    consultation_type: consultationData.consultation_type,
    preferred_date: consultationData.preferred_date,
    preferred_time: consultationData.preferred_time,
    call_notes: consultationData.notes ? [consultationData.notes] : [],
    tags: ['consultation_request', consultationData.consultation_type],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('crm_leads')
    .insert([leadData])
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

// Create a lead from contact form
export const createLeadFromContact = async (contactData: any): Promise<string> => {
  const leadData: Partial<Lead> = {
    name: contactData.name,
    email: contactData.email,
    phone: contactData.phone,
    source: 'website',
    status: 'new',
    contact_origin: 'Contact form submission',
    call_notes: contactData.message ? [contactData.message] : [],
    tags: ['website_contact'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('crm_leads')
    .insert([leadData])
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

// Get all leads with filtering and sorting
export const getLeads = async (filters?: {
  status?: string;
  source?: string;
  accredited?: boolean;
  search?: string;
}): Promise<Lead[]> => {
  let query = supabase
    .from('crm_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }
  if (filters?.accredited !== undefined) {
    query = query.eq('accredited', filters.accredited);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// Update lead
export const updateLead = async (id: string, updates: Partial<Lead>): Promise<void> => {
  const { error } = await supabase
    .from('crm_leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
};

// Add activity to lead
export const addLeadActivity = async (activity: Omit<CRMActivity, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('crm_activities')
    .insert([{
      ...activity,
      created_at: new Date().toISOString()
    }]);

  if (error) throw error;
};

// Get lead activities
export const getLeadActivities = async (leadId: string): Promise<CRMActivity[]> => {
  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get CRM statistics
export const getCRMStats = async (): Promise<CRMStats> => {
  const { data: leads, error } = await supabase
    .from('crm_leads')
    .select('*');

  if (error) throw error;

  const total_leads = leads?.length || 0;
  const new_leads = leads?.filter(l => l.status === 'new').length || 0;
  const qualified_leads = leads?.filter(l => l.status === 'qualified').length || 0;
  const closed_won = leads?.filter(l => l.status === 'closed_won').length || 0;
  
  const conversion_rate = total_leads > 0 ? (closed_won / total_leads) * 100 : 0;
  
  const pipeline_value = leads?.reduce((sum, lead) => {
    return sum + (lead.investment_amount || 0);
  }, 0) || 0;

  const avg_deal_size = closed_won > 0 ? pipeline_value / closed_won : 0;

  const thisMonth = new Date();
  thisMonth.setDate(1);
  const this_month_conversions = leads?.filter(l => 
    l.status === 'closed_won' && 
    new Date(l.updated_at) >= thisMonth
  ).length || 0;

  const contacted_leads = leads?.filter(l => l.status !== 'new').length || 0;
  const response_rate = total_leads > 0 ? (contacted_leads / total_leads) * 100 : 0;

  return {
    total_leads,
    new_leads,
    qualified_leads,
    conversion_rate,
    avg_deal_size,
    pipeline_value,
    this_month_conversions,
    response_rate
  };
};

// Get lead by email (to prevent duplicates)
export const getLeadByEmail = async (email: string): Promise<Lead | null> => {
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Bulk update leads
export const bulkUpdateLeads = async (leadIds: string[], updates: Partial<Lead>): Promise<void> => {
  const { error } = await supabase
    .from('crm_leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .in('id', leadIds);

  if (error) throw error;
};