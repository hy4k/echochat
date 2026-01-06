import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('[Supabase] Missing URL or Service Role Key in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
