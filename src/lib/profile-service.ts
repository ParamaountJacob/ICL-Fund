import { supabase } from './client';

export interface UserProfile {
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
    created_at?: string;
    updated_at?: string;
}

export const profileService = {
    // Get user profile
    async getUserProfile(userId?: string): Promise<UserProfile | null> {
        try {
            let targetUserId = userId;

            if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                targetUserId = user?.id;
            }

            if (!targetUserId) {
                return null;
            }

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', targetUserId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching user profile:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            return null;
        }
    },

    // Update user profile with robust fallback mechanism
    async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = profile.user_id || (user ? user.id : null);

        if (!userId) {
            throw new Error('PROFILE_UPDATE_FAILED: No user ID available for profile update');
        }

        // Validate required profile data
        if (!profile.first_name && !profile.last_name && !profile.phone && !profile.address) {
            throw new Error('PROFILE_UPDATE_FAILED: No profile data provided for update');
        }

        console.log('=== UPDATE USER PROFILE START ===');
        console.log('Updating profile for user ID:', userId);
        console.log('Profile data to save:', profile);

        let updateResult: UserProfile | null = null;
        let lastError: Error | null = null;

        try {
            // ATTEMPT 1: Try database function (preferred method)
            console.log('Attempting to use database function...');
            const { data: functionResult, error: functionError } = await supabase.rpc('safe_upsert_user_profile', {
                p_user_id: userId,
                p_first_name: profile.first_name,
                p_last_name: profile.last_name,
                p_phone: profile.phone || null,
                p_address: profile.address || null,
                p_ira_accounts: profile.ira_accounts || null,
                p_investment_goals: profile.investment_goals || null,
                p_risk_tolerance: profile.risk_tolerance || null,
                p_net_worth: profile.net_worth || null,
                p_annual_income: profile.annual_income || null
            });

            if (!functionError && functionResult) {
                console.log('Database function succeeded');
                updateResult = await this.getUserProfile(userId);
                if (updateResult) {
                    console.log('=== UPDATE USER PROFILE SUCCESS (via function) ===');
                    return updateResult;
                }
            } else {
                lastError = new Error(`DATABASE_FUNCTION_FAILED: ${functionError?.message || 'Unknown error'}`);
                console.warn('Database function failed:', lastError.message);
            }

            // ATTEMPT 2: Direct database operations with proper error checking
            console.log('Attempting direct database update...');

            // First, check if profile exists
            const { data: existingProfile, error: checkError } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle();

            if (checkError) {
                lastError = new Error(`PROFILE_CHECK_FAILED: ${checkError.message}`);
                throw lastError;
            }

            const profileData = {
                user_id: userId,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone,
                address: profile.address,
                ira_accounts: profile.ira_accounts,
                investment_goals: profile.investment_goals,
                risk_tolerance: profile.risk_tolerance,
                net_worth: profile.net_worth,
                annual_income: profile.annual_income,
                updated_at: new Date().toISOString()
            };

            if (existingProfile) {
                // Profile exists - update it
                const { data: updateData, error: updateError } = await supabase
                    .from('user_profiles')
                    .update(profileData)
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (updateError) {
                    lastError = new Error(`PROFILE_UPDATE_FAILED: ${updateError.message}`);
                    throw lastError;
                }

                console.log('Direct update succeeded');
                updateResult = updateData as UserProfile;
            } else {
                // Profile doesn't exist - create it
                const { data: insertData, error: insertError } = await supabase
                    .from('user_profiles')
                    .insert(profileData)
                    .select()
                    .single();

                if (insertError) {
                    lastError = new Error(`PROFILE_INSERT_FAILED: ${insertError.message}`);
                    throw lastError;
                }

                console.log('Direct insert succeeded');
                updateResult = insertData as UserProfile;
            }

            if (updateResult) {
                console.log('=== UPDATE USER PROFILE SUCCESS (via direct operations) ===');
                return updateResult;
            } else {
                throw new Error('PROFILE_UPDATE_FAILED: No result returned from database operations');
            }

        } catch (error) {
            console.error('=== UPDATE USER PROFILE FAILED ===');
            console.error('Final error:', error);
            throw lastError || error;
        }
    },

    // Create or update profile from consultation form data
    async updateProfileFromConsultation(userId: string, consultationData: {
        first_name: string;
        last_name: string;
        phone: string;
        address?: string;
        retirement_account_details?: string;
        investment_goals?: string;
    }): Promise<UserProfile | null> {
        return await this.updateUserProfile({
            user_id: userId,
            first_name: consultationData.first_name,
            last_name: consultationData.last_name,
            phone: consultationData.phone,
            address: consultationData.address || null,
            ira_accounts: consultationData.retirement_account_details || null,
            investment_goals: consultationData.investment_goals || null,
        });
    }
};
