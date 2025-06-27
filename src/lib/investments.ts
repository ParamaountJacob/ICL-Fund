import { supabase } from './client';
import type { InvestmentStatus } from '../types';

export interface Investment {
    id: string;
    user_id: string;
    application_id: string;
    amount: number;
    annual_percentage: number;
    payment_frequency: string;
    term_months: number;
    start_date: string;
    status: InvestmentStatus;
    total_expected_return: number;
    created_at: string;
    updated_at: string;
}

export interface InvestmentApplication {
    id: string;
    user_id: string;
    investment_amount: number;
    annual_percentage: number;
    payment_frequency: string;
    term_months: number;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface InvestmentWithApplication extends Investment {
    application_status?: string;
    investment_amount?: number;
    user_email?: string;
    user_first_name?: string;
    user_last_name?: string;
}

export const investmentService = {
    // Get user investments with applications (with fallback)
    async getUserInvestmentsWithApplications(userId: string): Promise<InvestmentWithApplication[]> {
        try {
            // Use the new simple workflow function
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('get_user_applications');

            if (!rpcError && rpcData) {
                return rpcData;
            }

            // Fallback to direct queries if RPC function fails
            console.warn('RPC function failed, using fallback query:', rpcError);

            const { data, error } = await supabase
                .from('investments')
                .select(`
          *,
          investment_applications!inner (
            status,
            investment_amount
          )
        `)
                .eq('user_id', userId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching user investments:', error);
            throw error;
        }
    },

    // Get all investments for admin (with fallback)
    async getAdminInvestmentsWithUsers(): Promise<InvestmentWithApplication[]> {
        try {
            // Try the RPC function first
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('get_admin_investments_with_users');

            if (!rpcError && rpcData) {
                return rpcData;
            }

            // Fallback to direct queries if RPC function fails
            console.warn('RPC function failed, using fallback query:', rpcError);

            const { data, error } = await supabase
                .from('investments')
                .select(`
          *,
          investment_applications (
            status,
            investment_amount
          )
        `);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching admin investments:', error);
            throw error;
        }
    },

    // Create new investment
    async createInvestment(investmentData: Omit<Investment, 'id' | 'created_at' | 'updated_at'>): Promise<Investment> {
        try {
            const { data, error } = await supabase
                .from('investments')
                .insert({
                    ...investmentData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating investment:', error);
            throw error;
        }
    },

    // Update investment status
    async updateInvestmentStatus(investmentId: string, status: InvestmentStatus): Promise<void> {
        try {
            const { error } = await supabase
                .from('investments')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', investmentId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating investment status:', error);
            throw error;
        }
    },

    // Delete investment (admin only)
    async deleteInvestment(investmentId: string): Promise<void> {
        try {
            const { error } = await supabase.functions.invoke('delete-investment', {
                body: { investmentId }
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting investment:', error);
            throw error;
        }
    },

    // Get investment applications
    async getInvestmentApplications(userId?: string): Promise<InvestmentApplication[]> {
        try {
            let query = supabase
                .from('investment_applications')
                .select('*')
                .order('created_at', { ascending: false });

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching investment applications:', error);
            throw error;
        }
    },

    // Create investment application
    async createInvestmentApplication(applicationData: Omit<InvestmentApplication, 'id' | 'created_at' | 'updated_at'>): Promise<InvestmentApplication> {
        try {
            const { data, error } = await supabase
                .from('investment_applications')
                .insert({
                    ...applicationData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating investment application:', error);
            throw error;
        }
    }
};
