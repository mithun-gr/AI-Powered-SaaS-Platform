import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url-for-build.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key_for_build';

if (supabaseUrl === 'https://dummy-url-for-build.supabase.co') {
  console.warn("Supabase URL or Anon Key is missing in environment variables. Build will succeed but app will fail at runtime if not set.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);