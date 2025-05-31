import { supabase, dbConfig } from '../config/database.js';

// Middleware to check if database is configured
export const checkDbConfig = (req, res, next) => {
    if (!dbConfig.isConfigured) {
        return res.status(503).json({
            success: false,
            message: 'Database not configured',
            error: 'Please configure Supabase credentials in your .env file'
        });
    }
    next();
};