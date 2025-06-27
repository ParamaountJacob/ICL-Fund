import { createClient } from '@supabase/supabase-js';

declare global {
    interface ImportMeta {
        env: {
            VITE_SUPABASE_URL: string;
            VITE_SUPABASE_ANON_KEY: string;
        };
    }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Re-export commonly used types
export type DocumentType = 'pitch_deck' | 'ppm' | 'wire_instructions' | 'subscription_agreement' | 'promissory_note';
export type VerificationStatus = 'pending' | 'verified';
export type UserRole = 'user' | 'sub_admin' | 'admin';
