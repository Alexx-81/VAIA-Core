import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ptigdekgzraimaepgczt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aWdkZWtnenJhaW1hZXBnY3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzI2MjAsImV4cCI6MjA4NTgwODYyMH0.HNvrChq679tYAaN120fM-333Fv4wwtZVfZxDTKgyFnc';

// Create typed Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Export the client type for use in other files
export type SupabaseClient = typeof supabase;
