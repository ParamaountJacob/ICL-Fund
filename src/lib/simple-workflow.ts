import { supabase } from './client';

// ===============================================
// TYPES FOR SIMPLE WORKFLOW
// ===============================================

export type WorkflowStep =
    | 'subscription_pending'    // Step 1: User needs to sign subscription agreement
    | 'admin_review'           // Step 1.1: Admin needs to sign subscription agreement  
    | 'promissory_pending'     // Step 2: Admin creates promissory note, user signs it
    | 'funds_pending'          // Step 2.1: User needs to wire funds
    | 'admin_confirm'          // Step 3: Admin confirms promissory note + funds
    | 'plaid_pending'          // Step 4: User connects bank via Plaid
    | 'admin_complete'         // Step 4.1: Admin completes setup
    | 'active';                // Investment is fully active

export interface SimpleApplication {
    id: string;
    user_id?: string;
    investment_amount: number;
    annual_percentage: number;
    payment_frequency: string;
    term_months: number;
    current_step: WorkflowStep;

    // Step completion tracking
    subscription_signed_by_user?: string;
    subscription_signed_by_admin?: string;
    promissory_note_created?: string;
    promissory_note_signed?: string;
    funds_received?: string;
    admin_confirmed?: string;
    plaid_connected?: string;
    admin_completed?: string;

    created_at: string;
    updated_at: string;
}

export interface AdminApplication extends SimpleApplication {
    user_email: string;
    user_first_name: string;
    user_last_name: string;
}

export interface SimpleInvestment {
    id: string;
    application_id: string;
    user_id: string;
    amount: number;
    annual_percentage: number;
    payment_frequency: string;
    term_months: number;
    status: WorkflowStep;
    activated_at?: string;
    created_at: string;
    updated_at: string;
}

// ===============================================
// USER WORKFLOW FUNCTIONS
// ===============================================

/**
 * Step 1: Create a new investment application
 */
export const createApplication = async (
    investmentAmount: number,
    annualPercentage: number = 12,
    paymentFrequency: string = 'monthly',
    termMonths: number = 24
): Promise<string> => {
    try {
        const { data, error } = await supabase.rpc('create_simple_application', {
            p_investment_amount: investmentAmount,
            p_annual_percentage: annualPercentage,
            p_payment_frequency: paymentFrequency,
            p_term_months: termMonths
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating application:', error);
        throw error;
    }
};

/**
 * Step 1: User signs subscription agreement
 */
export const userSignSubscription = async (applicationId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('user_sign_subscription', {
            p_application_id: applicationId
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error signing subscription:', error);
        throw error;
    }
};

/**
 * Step 2: User signs promissory note
 */
export const userSignPromissoryNote = async (applicationId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('user_sign_promissory_note', {
            p_application_id: applicationId
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error signing promissory note:', error);
        throw error;
    }
};

/**
 * Step 2.1: User completes wire transfer
 */
export const userCompleteWireTransfer = async (applicationId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('user_complete_wire_transfer', {
            p_application_id: applicationId
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error completing wire transfer:', error);
        throw error;
    }
};

/**
 * Step 4: User connects Plaid
 */
export const userConnectPlaid = async (applicationId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('user_connect_plaid', {
            p_application_id: applicationId
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error connecting Plaid:', error);
        throw error;
    }
};

/**
 * Get current user's applications
 */
export const getUserApplications = async (): Promise<SimpleApplication[]> => {
    try {
        const { data, error } = await supabase.rpc('get_user_applications');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user applications:', error);
        throw error;
    }
};

// ===============================================
// ADMIN WORKFLOW FUNCTIONS
// ===============================================

/**
 * Step 1.1: Admin signs subscription agreement
 */
export const adminSignSubscription = async (applicationId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('admin_sign_subscription', {
            p_application_id: applicationId
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error admin signing subscription:', error);
        throw error;
    }
};

/**
 * Step 2: Admin creates and sends promissory note
 */
export const adminCreatePromissoryNote = async (
    applicationId: string,
    notes?: string
): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('admin_create_promissory_note', {
            p_application_id: applicationId,
            p_notes: notes
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating promissory note:', error);
        throw error;
    }
};

/**
 * Step 3: Admin confirms investment (promissory note + funds)
 */
export const adminConfirmInvestment = async (
    applicationId: string,
    notes?: string
): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('admin_confirm_investment', {
            p_application_id: applicationId,
            p_notes: notes
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error confirming investment:', error);
        throw error;
    }
};

/**
 * Step 4.1: Admin completes setup
 */
export const adminCompleteSetup = async (
    applicationId: string,
    notes?: string
): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('admin_complete_setup', {
            p_application_id: applicationId,
            p_notes: notes
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error completing setup:', error);
        throw error;
    }
};

/**
 * Get all applications for admin view
 */
export const getAdminApplications = async (): Promise<AdminApplication[]> => {
    try {
        const { data, error } = await supabase.rpc('get_admin_applications');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching admin applications:', error);
        throw error;
    }
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

/**
 * Get the display text for each workflow step
 */
export const getStepDisplayText = (step: WorkflowStep): string => {
    switch (step) {
        case 'subscription_pending':
            return 'Step 1: Sign Subscription Agreement';
        case 'admin_review':
            return 'Step 1.1: Awaiting Admin Signature';
        case 'promissory_pending':
            return 'Step 2: Sign Promissory Note';
        case 'funds_pending':
            return 'Step 2.1: Complete Wire Transfer';
        case 'admin_confirm':
            return 'Step 3: Awaiting Admin Confirmation';
        case 'plaid_pending':
            return 'Step 4: Connect Bank Account';
        case 'admin_complete':
            return 'Step 4.1: Awaiting Final Setup';
        case 'active':
            return 'Investment Active';
        default:
            return 'Unknown Step';
    }
};

/**
 * Get the action text for each workflow step
 */
export const getStepActionText = (step: WorkflowStep, isAdmin: boolean = false): string => {
    if (isAdmin) {
        switch (step) {
            case 'admin_review':
                return 'Sign Subscription Agreement';
            case 'promissory_pending':
                return 'Create Promissory Note';
            case 'admin_confirm':
                return 'Confirm Investment';
            case 'admin_complete':
                return 'Complete Setup';
            default:
                return 'Awaiting User Action';
        }
    } else {
        switch (step) {
            case 'subscription_pending':
                return 'Sign Subscription Agreement';
            case 'promissory_pending':
                return 'Sign Promissory Note';
            case 'funds_pending':
                return 'Complete Wire Transfer';
            case 'plaid_pending':
                return 'Connect Bank Account';
            default:
                return 'Awaiting Admin Action';
        }
    }
};

/**
 * Check if current step requires user action
 */
export const isUserActionRequired = (step: WorkflowStep): boolean => {
    return ['subscription_pending', 'promissory_pending', 'funds_pending', 'plaid_pending'].includes(step);
};

/**
 * Check if current step requires admin action
 */
export const isAdminActionRequired = (step: WorkflowStep): boolean => {
    return ['admin_review', 'admin_confirm', 'admin_complete'].includes(step);
};

/**
 * Get progress percentage for the workflow
 */
export const getProgressPercentage = (step: WorkflowStep): number => {
    const stepOrder: WorkflowStep[] = [
        'subscription_pending',
        'admin_review',
        'promissory_pending',
        'funds_pending',
        'admin_confirm',
        'plaid_pending',
        'admin_complete',
        'active'
    ];

    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex === -1) return 0;

    return Math.round((currentIndex / (stepOrder.length - 1)) * 100);
};

export default {
    // User functions
    createApplication,
    userSignSubscription,
    userSignPromissoryNote,
    userCompleteWireTransfer,
    userConnectPlaid,
    getUserApplications,

    // Admin functions
    adminSignSubscription,
    adminCreatePromissoryNote,
    adminConfirmInvestment,
    adminCompleteSetup,
    getAdminApplications,

    // Utilities
    getStepDisplayText,
    getStepActionText,
    isUserActionRequired,
    isAdminActionRequired,
    getProgressPercentage,

    // Notifications
    getUserNotifications,
    getAdminNotifications,
    markNotificationRead
};

// ===============================================
// NOTIFICATION TYPES
// ===============================================

export interface SimpleNotification {
    id: string;
    application_id: string;
    title: string;
    message: string;
    notification_type: 'user_action_needed' | 'admin_action_needed' | 'step_complete';
    current_step: WorkflowStep;
    is_read: boolean;
    created_at: string;
}

export interface AdminNotification extends SimpleNotification {
    user_email: string;
    user_first_name: string;
    user_last_name: string;
}

// ===============================================
// NOTIFICATION FUNCTIONS
// ===============================================

/**
 * Get user notifications
 */
export const getUserNotifications = async (limit: number = 10): Promise<SimpleNotification[]> => {
    try {
        const { data, error } = await supabase.rpc('get_user_notifications', { p_limit: limit });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        throw error;
    }
};

/**
 * Get admin notifications
 */
export const getAdminNotifications = async (limit: number = 10): Promise<AdminNotification[]> => {
    try {
        const { data, error } = await supabase.rpc('get_admin_notifications', { p_limit: limit });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        throw error;
    }
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('mark_simple_notification_read', {
            p_notification_id: notificationId
        });

        if (error) throw error;
        return data || false;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};
