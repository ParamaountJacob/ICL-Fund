export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: 'email' | 'website' | 'referral' | 'calendar' | 'consultation';
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'closed_won' | 'closed_lost';
  accredited: boolean | null;
  contact_origin: string;
  call_notes: string[];
  phone_answered: boolean | null;
  tags: string[];
  date_of_contact?: string;
  who_took_call?: string;
  investment_interest?: number;
  consultation_type?: 'video' | 'phone';
  preferred_date?: string;
  preferred_time?: string;
  created_at: string;
  updated_at: string;
  last_contact_date?: string;
  next_follow_up?: string;
  conversion_probability?: number;
  documents_sent?: string[];
  meeting_scheduled?: boolean;
  investment_amount?: number;
  timeline?: string;
  decision_maker?: boolean;
  budget_confirmed?: boolean;
  pain_points?: string[];
  goals?: string[];
  current_investments?: string;
  risk_tolerance?: string;
  liquidity_needs?: string;
  tax_situation?: string;
}

export interface CRMActivity {
  id: string;
  lead_id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'document_sent' | 'follow_up';
  description: string;
  outcome?: string;
  next_action?: string;
  created_by: string;
  created_at: string;
}

export interface CRMStats {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  conversion_rate: number;
  avg_deal_size: number;
  pipeline_value: number;
  this_month_conversions: number;
  response_rate: number;
}