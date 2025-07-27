import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ''; // replace with your Supabase project URL
const supabaseAnonKey = ''; // replace with your Supabase anon public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
