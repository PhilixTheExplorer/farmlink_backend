import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check for placeholder values or missing credentials
if (!supabaseUrl || !supabaseKey ||
    supabaseUrl.includes('your-supabase') ||
    supabaseKey.includes('your-supabase')) {
    console.warn('⚠️  Supabase credentials contain placeholder values or are missing.');
    console.warn('Please update your .env file with actual Supabase credentials.');
}

let supabase = null;
let supabaseAdmin = null;

// Only create clients if we have valid credentials
if (supabaseUrl && supabaseKey &&
    !supabaseUrl.includes('your-supabase') &&
    !supabaseKey.includes('your-supabase')) {
    try {
        // Client for general use (with RLS policies)
        supabase = createClient(supabaseUrl, supabaseKey);

        // Admin client for operations that bypass RLS (use with caution)
        if (supabaseServiceKey && !supabaseServiceKey.includes('your-supabase')) {
            supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
        }
    } catch (error) {
        console.error('Failed to initialize Supabase clients:', error.message);
    }
}

// Database configuration
export const dbConfig = {
    url: supabaseUrl,
    anonKey: supabaseKey,
    serviceRoleKey: supabaseServiceKey,
    isConfigured: !!(supabase)
};

export { supabase, supabaseAdmin };
export default supabase;
