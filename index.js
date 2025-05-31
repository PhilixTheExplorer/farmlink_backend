import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import usersRouter from './routes/users.js';
import farmersRouter from './routes/farmers.js';
import buyersRouter from './routes/buyers.js';
import productsRouter from './routes/products.js';
import dashboardRouter from './routes/dashboard.js';
import { rateLimit } from './middleware/validation.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Check for placeholder values or missing credentials
if (!supabaseUrl || !supabaseKey ||
    supabaseUrl.includes('your-supabase') ||
    supabaseKey.includes('your-supabase')) {
    console.warn('⚠️  Supabase credentials not configured properly.');
    console.warn('Please update your .env file with actual Supabase credentials.');
    console.warn('Server will start but database operations will fail until configured.');
}

let supabase = null;
if (supabaseUrl && supabaseKey &&
    !supabaseUrl.includes('your-supabase') &&
    !supabaseKey.includes('your-supabase')) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error.message);
    }
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Rate limiting
app.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Farm Link Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Test Supabase connection
app.get('/api/test-db', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(503).json({
                message: 'Database not configured',
                connected: false,
                error: 'Supabase credentials not properly configured in .env file',
                timestamp: new Date().toISOString()
            });
        }        // Test the connection by trying to query the users table
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.status(200).json({
            message: 'Database connection successful',
            connected: true,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            message: 'Database connection failed',
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/farmers', farmersRouter);
app.use('/api/buyers', buyersRouter);
app.use('/api/products', productsRouter);
app.use('/api', dashboardRouter);

// API info endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'Farm Link Backend API',
        version: '1.0.0', endpoints: {
            health: '/health',
            testDb: '/api/test-db',
            dashboard: '/api/dashboard',
            users: '/api/users',
            farmers: '/api/farmers',
            buyers: '/api/buyers',
            products: '/api/products'
        },
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Farm Link Backend server is running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Database test: http://localhost:${PORT}/api/test-db`);
    console.log(`📋 API info: http://localhost:${PORT}/api`);
    console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
