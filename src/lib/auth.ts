import { supabase } from './client';
import { goHighLevelService } from './gohighlevel';
import type { UserRole } from '../types';

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    first_name?: string;
    last_name?: string;
    phone?: string;
    profile_updated?: boolean;
}

export const authService = {
    // Get current user
    async getCurrentUser(): Promise<AuthUser | null> {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                return null;
            }

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role, is_admin, first_name, last_name')
                .eq('user_id', user.id)
                .single();

            return {
                id: user.id,
                email: user.email!,
                role: profile?.role || 'user',
                first_name: profile?.first_name || user.user_metadata?.first_name,
                last_name: profile?.last_name || user.user_metadata?.last_name,
                phone: user.user_metadata?.phone,
                profile_updated: true
            };
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // Sign in
    async signIn(email: string, password: string) {
        return await supabase.auth.signInWithPassword({ email, password });
    },

    // Sign up with GoHighLevel integration
    async signUp(email: string, password: string, userData?: {
        first_name?: string;
        last_name?: string;
        phone?: string;
    }) {
        // Create user account without email verification
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData,
                emailRedirectTo: undefined // Disable email verification
            }
        });

        // If user was created successfully, sync to GoHighLevel
        if (data.user && !error) {
            try {
                await goHighLevelService.syncContact({
                    email: email,
                    firstName: userData?.first_name,
                    lastName: userData?.last_name,
                    phone: userData?.phone,
                    source: 'ICL Website Signup'
                });
                console.log('User synced to GoHighLevel successfully');
            } catch (ghlError) {
                console.error('Failed to sync user to GoHighLevel:', ghlError);
                // Don't fail the signup if GoHighLevel sync fails
            }
        }

        return { data, error };
    },

    // Sign in with OAuth
    async signInWithOAuth(provider: 'google' | 'github' | 'apple', redirectTo?: string) {
        return await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: redirectTo || window.location.origin
            }
        });
    },

    // Sign out
    async signOut() {
        return await supabase.auth.signOut();
    },

    // Update user profile
    async updateProfile(updates: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        profile_updated?: boolean;
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        // Update auth metadata
        const { error: authError } = await supabase.auth.updateUser({
            data: updates
        });

        if (authError) throw authError;

        // Update profile table
        const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
                id: user.id,
                profile_updated: updates.profile_updated ?? true,
                updated_at: new Date().toISOString()
            });

        if (profileError) throw profileError;

        // Sync updates to GoHighLevel
        try {
            await goHighLevelService.syncContact({
                email: user.email!,
                firstName: updates.first_name,
                lastName: updates.last_name,
                phone: updates.phone,
                source: 'ICL Profile Update'
            });
        } catch (ghlError) {
            console.error('Failed to sync profile update to GoHighLevel:', ghlError);
            // Don't fail the profile update if GoHighLevel sync fails
        }
    },

    // Reset password (disabled - will not send emails)
    async resetPassword(email: string) {
        console.log('Password reset disabled. Please contact support for password assistance.');
        return {
            data: null,
            error: new Error('Password reset is disabled. Please contact support for assistance.')
        };
    },

    // Check if user has role
    async hasRole(requiredRole: UserRole): Promise<boolean> {
        const user = await this.getCurrentUser();
        if (!user) return false;

        const roleHierarchy: Record<UserRole, number> = {
            user: 0,
            sub_admin: 1,
            admin: 2
        };

        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    }
};
