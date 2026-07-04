/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Check if variables are configured correctly
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' && 
  !!supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-public-key';

// Initialize the real Supabase client if configured, otherwise null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to get raw variables for debugging / setup assistance
export const supabaseConfig = {
  url: supabaseUrl || '',
  anonKey: supabaseAnonKey || '',
};
