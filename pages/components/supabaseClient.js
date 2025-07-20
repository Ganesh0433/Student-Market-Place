import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pufrzqbnaeaclfoudrot.supabase.co'; // replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZnJ6cWJuYWVhY2xmb3Vkcm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTAwODE0MiwiZXhwIjoyMDY0NTg0MTQyfQ.PSgUyZ79zutxUD3PVnDGgMuCcdJFqqfxpoPcjQoCQx0'; // replace with your Supabase anon public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
