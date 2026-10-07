import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Detect if live remote Supabase credentials are configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-publishable-key' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://')
);

/**
 * Supabase client instance.
 * Gracefully configured for production and local development.
 * Never leaks service role keys.
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://dummy-auth-preview.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'dummy-anon-key-for-local-preview-mode',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);
