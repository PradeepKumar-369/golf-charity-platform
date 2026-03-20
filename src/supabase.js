import { createClient } from '@supabase/supabase-js'

// This connects to your actual database using your .env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)