import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { supabase, dbConfig, testDbConnection, getDbStatus, testTableAccess } from './config/database.js';
import usersRouter from './routes/users.js';
import farmersRouter from './routes/farmers.js';
import buyersRouter from './routes/buyers.js';
import productsRouter from './routes/products.js';
import dashboardRouter from './routes/dashboard.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import { rateLimit } from './middleware/validation.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

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
        if (!dbConfig.isConfigured) {
            return res.status(503).json({
                message: 'Database not configured',
                connected: false,
                error: 'Supabase credentials not properly configured in .env file',
                config: getDbStatus(),
                timestamp: new Date().toISOString()
            });
        }

        // Use centralized test function
        const result = await testDbConnection();

        res.status(200).json({
            message: result.message,
            connected: true,
            config: getDbStatus(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            message: 'Database connection failed',
            connected: false,
            error: error.message,
            config: getDbStatus(),
            timestamp: new Date().toISOString()
        });
    }
});

// Database status endpoint with table access testing
app.get('/api/db-status', async (req, res) => {
    try {
        const status = getDbStatus();

        if (!dbConfig.isConfigured) {
            return res.status(503).json({
                status: 'not_configured',
                ...status,
                timestamp: new Date().toISOString()
            });
        }

        // Test core tables
        const tables = ['users', 'farmers', 'buyers', 'products', 'orders'];
        const tableTests = {};

        for (const table of tables) {
            tableTests[table] = await testTableAccess(table);
        }

        res.status(200).json({
            status: 'configured',
            ...status,
            tables: tableTests,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database status check error:', error);
        res.status(500).json({
            status: 'error',
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
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api', dashboardRouter);

// API info endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'Farm Link Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            testDb: '/api/test-db',
            dbStatus: '/api/db-status',
            dashboard: '/api/dashboard',
            users: '/api/users',
            farmers: '/api/farmers',
            buyers: '/api/buyers',
            products: '/api/products',
            cart: '/api/cart',
            orders: '/api/orders'
        },
        database: getDbStatus(),
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
    console.log(`🌱 Environment: ${dbConfig.environment}`);
    console.log(`💾 Database configured: ${dbConfig.isConfigured ? '✅' : '❌'}`);
    if (dbConfig.isConfigured) {
        console.log(`🔗 Supabase URL: ${dbConfig.url}`);
        console.log(`🔑 Admin access: ${dbConfig.hasAdminAccess ? '✅' : '❌'}`);
    }
});

export default app;
