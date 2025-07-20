// CENTRALIZED AUTH CONTEXT - Fixes auth race conditions and excessive calls
// This replaces scattered auth.getUser() calls throughout the app

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getUserProfile, checkUserRole, type UserProfile, type UserRole } from '../lib/supabase';
import { logger } from '../utils/logger';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    userRole: UserRole;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userRole, setUserRole] = useState<UserRole>('user');
    const [loading, setLoading] = useState(true);

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setLoading(true);

                // Get initial session
                const { data: { user: initialUser } } = await supabase.auth.getUser();
                logger.log('AuthContext - Initial user:', initialUser);
                setUser(initialUser);

                if (initialUser) {
                    // Fetch profile and role from database with timeout protection
                    try {
                        const profilePromise = getUserProfile();
                        const profileTimeout = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Initial getUserProfile timeout')), 5000)
                        );
                        const profileData = await Promise.race([profilePromise, profileTimeout]);
                        setProfile(profileData);

                        const rolePromise = checkUserRole();
                        const roleTimeout = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Initial checkUserRole timeout')), 5000)
                        );
                        const roleData = await Promise.race([rolePromise, roleTimeout]);
                        setUserRole(roleData);
                        logger.log('AuthContext - Successfully loaded profile/role:', { roleData, profileData });
                    } catch (error) {
                        logger.error('Error fetching profile/role:', error);
                        // Fallback: check if user is the admin email
                        if (initialUser.email === 'innercirclelending@gmail.com') {
                            setUserRole('admin');
                            logger.log('AuthContext - Set fallback admin role for innercirclelending@gmail.com');
                        } else {
                            setUserRole('user');
                        }
                        setProfile(null);
                    }
                } else {
                    // No user logged in, ensure clean state
                    setProfile(null);
                    setUserRole('user');
                }
            } catch (error) {
                logger.error('Error initializing auth:', error);
                setUser(null);
                setProfile(null);
                setUserRole('user');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change event:', event);
            console.log('Session user:', session?.user?.email);

            const newUser = session?.user ?? null;
            logger.log('AuthContext - Auth state changed:', event, newUser);
            setUser(newUser);

            if (newUser) {
                console.log('User signed in, fetching profile and role...');
                console.log('User ID:', newUser.id);
                console.log('User email:', newUser.email);

                // Fetch profile and role when user logs in
                try {
                    console.log('Calling getUserProfile()...');

                    // Add timeout protection to prevent infinite loading
                    const profilePromise = getUserProfile();
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('getUserProfile timeout')), 5000)
                    );

                    const profileData = await Promise.race([profilePromise, timeoutPromise]);
                    console.log('getUserProfile() result:', profileData);
                    setProfile(profileData);

                    console.log('Calling checkUserRole()...');

                    // Add timeout protection for role check too
                    const rolePromise = checkUserRole();
                    const roleTimeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('checkUserRole timeout')), 5000)
                    );

                    const roleData = await Promise.race([rolePromise, roleTimeoutPromise]);
                    console.log('checkUserRole() result:', roleData);
                    setUserRole(roleData);
                    console.log('Successfully loaded profile/role:', { roleData, profileData });
                    logger.log('AuthContext - Auth change: Successfully loaded profile/role:', { roleData, profileData });
                } catch (error) {
                    console.error('Error fetching profile/role on auth change:', error);
                    logger.error('Error fetching profile/role on auth change:', error);
                    // Fallback: check if user is the admin email
                    if (newUser.email === 'innercirclelending@gmail.com') {
                        setUserRole('admin');
                        console.log('Set fallback admin role for innercirclelending@gmail.com');
                        logger.log('AuthContext - Auth change: Set fallback admin role for innercirclelending@gmail.com');
                    } else {
                        setUserRole('user');
                    }
                    setProfile(null);
                }
                // Clear loading state after processing auth change
                setLoading(false);
            } else {
                console.log('User signed out, clearing data...');
                // Clear data when user logs out
                setProfile(null);
                setUserRole('user');
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            console.log('Starting signOut process...');

            // Clear local state first
            setUser(null);
            setProfile(null);
            setUserRole('user');
            setLoading(false);

            console.log('Local state cleared, calling supabase.auth.signOut()...');

            // Then sign out from Supabase
            await supabase.auth.signOut();

            console.log('Supabase signOut completed, redirecting to home...');

            // Force page reload to clear any cached state
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out:', error);
            // Even if there's an error, clear local state and redirect
            setUser(null);
            setProfile(null);
            setUserRole('user');
            setLoading(false);
            window.location.href = '/';
        }
    };

    const refreshProfile = async () => {
        if (user) {
            try {
                const profileData = await getUserProfile();
                setProfile(profileData);
            } catch (error) {
                logger.error('Error refreshing profile:', error);
            }
        }
    };

    const refreshRole = async () => {
        if (user) {
            try {
                const roleData = await checkUserRole();
                setUserRole(roleData);
            } catch (error) {
                logger.error('Error refreshing role:', error);
            }
        }
    };

    const value: AuthContextType = {
        user,
        profile,
        userRole,
        loading,
        signOut,
        refreshProfile,
        refreshRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// HOC for protected routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
    return (props: P) => {
        const { user, loading } = useAuth();

        if (loading) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold"></div>
                </div>
            );
        }

        if (!user) {
            // Redirect to login or show auth modal
            return null;
        }

        return <Component {...props} />;
    };
};
