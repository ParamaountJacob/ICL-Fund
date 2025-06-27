import { supabase } from './client';
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
                .select('role, profile_updated')
                .eq('id', user.id)
                .single();

            return {
                id: user.id,
                email: user.email!,
                role: profile?.role || 'user',
                first_name: user.user_metadata?.first_name,
                last_name: user.user_metadata?.last_name,
                phone: user.user_metadata?.phone,
                profile_updated: profile?.profile_updated || false
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

    // Sign up
    async signUp(email: string, password: string, userData?: {
        first_name?: string;
        last_name?: string;
        phone?: string;
    }) {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
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
