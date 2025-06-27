import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type AuthUser } from '../lib/auth';

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, userData?: any) => Promise<void>;
    signOut: () => Promise<void>;
    getCurrentUser: () => Promise<void>;
    updateProfile: (updates: any) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            error: null,

            signIn: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const { error } = await authService.signIn(email, password);
                    if (error) throw error;

                    await get().getCurrentUser();
                } catch (error: any) {
                    set({ error: error.message || 'Sign in failed' });
                } finally {
                    set({ isLoading: false });
                }
            },

            signUp: async (email: string, password: string, userData?: any) => {
                set({ isLoading: true, error: null });
                try {
                    const { error } = await authService.signUp(email, password, userData);
                    if (error) throw error;

                    // Don't automatically fetch user after signup (needs email confirmation)
                } catch (error: any) {
                    set({ error: error.message || 'Sign up failed' });
                } finally {
                    set({ isLoading: false });
                }
            },

            signOut: async () => {
                set({ isLoading: true, error: null });
                try {
                    await authService.signOut();
                    set({ user: null });
                } catch (error: any) {
                    set({ error: error.message || 'Sign out failed' });
                } finally {
                    set({ isLoading: false });
                }
            },

            getCurrentUser: async () => {
                set({ isLoading: true, error: null });
                try {
                    const user = await authService.getCurrentUser();
                    set({ user });
                } catch (error: any) {
                    set({ error: error.message || 'Failed to get user', user: null });
                } finally {
                    set({ isLoading: false });
                }
            },

            updateProfile: async (updates: any) => {
                set({ isLoading: true, error: null });
                try {
                    await authService.updateProfile(updates);
                    await get().getCurrentUser(); // Refresh user data
                } catch (error: any) {
                    set({ error: error.message || 'Profile update failed' });
                } finally {
                    set({ isLoading: false });
                }
            },

            clearError: () => set({ error: null })
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
);
