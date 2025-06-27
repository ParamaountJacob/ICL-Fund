import { supabase } from './client';

export interface CRMContact {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    status: 'lead' | 'prospect' | 'investor' | 'inactive';
    source?: string;
    notes?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface CRMActivity {
    id: string;
    contact_id: string;
    type: 'call' | 'email' | 'meeting' | 'note' | 'investment' | 'document_signed';
    description: string;
    date: string;
    created_by: string;
    created_at: string;
}

export interface Consultation {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    preferred_date?: string;
    preferred_time?: string;
    investment_range?: string;
    risk_tolerance?: string;
    investment_goals?: string;
    liquidity_needs?: string;
    status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
    created_at: string;
    updated_at: string;
}

export const crmService = {
    // CRM Contacts
    async getContacts(): Promise<CRMContact[]> {
        try {
            const { data, error } = await supabase
                .from('crm_contacts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching CRM contacts:', error);
            throw error;
        }
    },

    async createContact(contactData: Omit<CRMContact, 'id' | 'created_at' | 'updated_at'>): Promise<CRMContact> {
        try {
            const { data, error } = await supabase
                .from('crm_contacts')
                .insert({
                    ...contactData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating CRM contact:', error);
            throw error;
        }
    },

    async updateContact(contactId: string, updates: Partial<CRMContact>): Promise<void> {
        try {
            const { error } = await supabase
                .from('crm_contacts')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contactId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating CRM contact:', error);
            throw error;
        }
    },

    // CRM Activities
    async getContactActivities(contactId: string): Promise<CRMActivity[]> {
        try {
            const { data, error } = await supabase
                .from('crm_activities')
                .select('*')
                .eq('contact_id', contactId)
                .order('date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching contact activities:', error);
            throw error;
        }
    },

    async createActivity(activityData: Omit<CRMActivity, 'id' | 'created_at'>): Promise<CRMActivity> {
        try {
            const { data, error } = await supabase
                .from('crm_activities')
                .insert({
                    ...activityData,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating CRM activity:', error);
            throw error;
        }
    },

    // Consultations
    async getConsultations(): Promise<Consultation[]> {
        try {
            const { data, error } = await supabase
                .from('consultations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching consultations:', error);
            throw error;
        }
    },

    async createConsultation(consultationData: Omit<Consultation, 'id' | 'created_at' | 'updated_at'>): Promise<Consultation> {
        try {
            const { data, error } = await supabase
                .from('consultations')
                .insert({
                    ...consultationData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Auto-create CRM contact from consultation
            await this.createContact({
                user_id: '', // Will be populated if they sign up
                first_name: consultationData.first_name,
                last_name: consultationData.last_name,
                email: consultationData.email,
                phone: consultationData.phone,
                status: 'lead',
                source: 'consultation_form',
                notes: `Investment range: ${consultationData.investment_range}, Goals: ${consultationData.investment_goals}`
            });

            return data;
        } catch (error) {
            console.error('Error creating consultation:', error);
            throw error;
        }
    },

    async updateConsultation(consultationId: string, updates: Partial<Consultation>): Promise<void> {
        try {
            const { error } = await supabase
                .from('consultations')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', consultationId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating consultation:', error);
            throw error;
        }
    },

    async deleteConsultation(consultationId: string): Promise<void> {
        try {
            const { error } = await supabase.functions.invoke('delete-consultation', {
                body: { consultationId }
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting consultation:', error);
            throw error;
        }
    }
};
