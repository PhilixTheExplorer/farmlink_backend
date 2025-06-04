import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

// Validation helper function
const isValidCredential = (credential) => {
    return credential &&
        typeof credential === 'string' &&
        credential.trim() !== '' &&
        !credential.includes('your-supabase') &&
        !credential.includes('your-project-id');
};

// Check for placeholder values or missing credentials
const validateCredentials = () => {
    const issues = [];

    if (!isValidCredential(supabaseUrl)) {
        issues.push('SUPABASE_URL is missing or contains placeholder values');
    }

    if (!isValidCredential(supabaseKey)) {
        issues.push('SUPABASE_ANON_KEY is missing or contains placeholder values');
    }

    if (issues.length > 0) {
        console.warn('⚠️  Supabase configuration issues detected:');
        issues.forEach(issue => console.warn(`   - ${issue}`));
        console.warn('Please update your .env file with actual Supabase credentials.');
        return false;
    }

    return true;
};

const isConfigurationValid = validateCredentials();

let supabase = null;
let supabaseAdmin = null;

// Only create clients if we have valid credentials
if (isConfigurationValid) {
    try {
        // Client for general use (with RLS policies)
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true
            }
        });

        // Admin client for operations that bypass RLS (use with caution)
        if (isValidCredential(supabaseServiceKey)) {
            supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
        }

        console.log('✅ Supabase clients initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Supabase clients:', error.message);
    }
} else {
    console.warn('⚠️  Supabase clients not initialized due to configuration issues');
}

// Test database connection helper
export const testDbConnection = async () => {
    if (!supabase) {
        throw new Error('Database not configured');
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return { connected: true, message: 'Database connection successful' };
    } catch (error) {
        throw new Error(`Database connection failed: ${error.message}`);
    }
};

// Database configuration object
export const dbConfig = {
    url: supabaseUrl,
    anonKey: supabaseKey,
    serviceRoleKey: supabaseServiceKey,
    jwtSecret: jwtSecret,
    isConfigured: isConfigurationValid && !!(supabase),
    hasAdminAccess: !!(supabaseAdmin),
    environment: process.env.NODE_ENV || 'development'
};

// Get database status information
export const getDbStatus = () => {
    return {
        isConfigured: dbConfig.isConfigured,
        hasAdminAccess: dbConfig.hasAdminAccess,
        environment: dbConfig.environment,
        url: dbConfig.url ? dbConfig.url.replace(/\/\/.*@/, '//***@') : null // Hide credentials in URL
    };
};

// Get Supabase client with error handling
export const getSupabaseClient = (requireAdmin = false) => {
    if (requireAdmin) {
        if (!supabaseAdmin) {
            throw new Error('Admin access not configured or unavailable');
        }
        return supabaseAdmin;
    }

    if (!supabase) {
        throw new Error('Database not configured');
    }

    return supabase;
};

// Test specific table access
export const testTableAccess = async (tableName) => {
    try {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from(tableName)
            .select('*')
            .limit(1);

        return {
            accessible: !error || error.code === 'PGRST116',
            error: error?.message
        };
    } catch (error) {
        return {
            accessible: false,
            error: error.message
        };
    }
};

export { supabase, supabaseAdmin };
export default supabase;
