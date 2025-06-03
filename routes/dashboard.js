import express from 'express';
import { supabase, dbConfig } from '../config/database.js';

const router = express.Router();

// GET API dashboard with complete endpoint documentation
router.get('/dashboard', async (req, res) => {
    try {
        // Get some basic statistics if database is configured
        let stats = null;
        if (dbConfig.isConfigured) {
            try {
                const [usersResult, farmersResult, buyersResult, productsResult] = await Promise.all([
                    supabase.from('users').select('id', { count: 'exact', head: true }),
                    supabase.from('farmers').select('id', { count: 'exact', head: true }),
                    supabase.from('buyers').select('id', { count: 'exact', head: true }),
                    supabase.from('products').select('id', { count: 'exact', head: true })
                ]);

                stats = {
                    totalUsers: usersResult.count || 0,
                    totalFarmers: farmersResult.count || 0,
                    totalBuyers: buyersResult.count || 0,
                    totalProducts: productsResult.count || 0
                };
            } catch (error) {
                console.warn('Could not fetch stats:', error.message);
            }
        }

        const apiDocumentation = {
            name: 'Farm Link Backend API',
            version: '1.0.0',
            description: 'Complete REST API for Farm Link platform connecting farmers and buyers',
            baseUrl: `${req.protocol}://${req.get('host')}/api`,
            timestamp: new Date().toISOString(),
            databaseConnected: dbConfig.isConfigured,
            statistics: stats,
            endpoints: {
                authentication: {
                    'POST /users/register': 'Register a new user (farmer or buyer)',
                    'POST /users/login': 'Login user and get JWT token'
                },
                users: {
                    'GET /users': 'Get all users with pagination and search',
                    'GET /users/:id': 'Get user by ID',
                    'GET /users/role/:role': 'Get users by role (farmer/buyer)',
                    'PUT /users/:id': 'Update user information',
                    'DELETE /users/:id': 'Delete user account',
                    'POST /users/seed-data': 'Seed database with sample users'
                },
                farmers: {
                    'GET /farmers': 'Get all farmers with pagination and filters',
                    'GET /farmers/:id': 'Get farmer profile by user ID',
                    'GET /farmers/user/:userId': 'Get farmer profile by user ID',
                    'PUT /farmers/:userId': 'Update farmer profile',
                    'PATCH /farmers/:userId/verify': 'Verify/unverify farmer',
                    'GET /farmers/:userId/stats': 'Get farmer statistics'
                },
                buyers: {
                    'GET /buyers': 'Get all buyers with pagination and search',
                    'GET /buyers/:id': 'Get buyer profile by user ID',
                    'GET /buyers/user/:userId': 'Get buyer profile by user ID',
                    'PUT /buyers/:userId': 'Update buyer profile',
                    'GET /buyers/:userId/stats': 'Get buyer statistics',
                    'GET /buyers/top/spenders': 'Get top buyers by total spent'
                },
                products: {
                    'GET /products': 'Get all products with advanced filtering',
                    'GET /products/:id': 'Get product by ID with farmer info',
                    'GET /products/farmer/:farmerId': 'Get products by farmer',
                    'GET /products/category/:category': 'Get products by category',
                    'POST /products': 'Create new product',
                    'PUT /products/:id': 'Update product',
                    'PATCH /products/:id/status': 'Update product status',
                    'PATCH /products/:id/quantity': 'Update product quantity',
                    'DELETE /products/:id': 'Delete product',
                    'GET /products/meta/categories': 'Get available categories',
                    'GET /products/meta/units': 'Get available units',
                    'GET /products/featured/popular': 'Get popular/featured products',
                    'POST /products/seed': 'Seed database with sample products'
                },
                cart: {
                    'GET /cart': 'Get current user\'s cart items with totals',
                    'POST /cart/items': 'Add item to cart',
                    'PUT /cart/items/:itemId': 'Update cart item quantity',
                    'DELETE /cart/items/:itemId': 'Remove item from cart',
                    'DELETE /cart/clear': 'Clear entire cart',
                    'GET /cart/summary': 'Get cart summary (item count and total)'
                },
                orders: {
                    'GET /orders': 'Get orders (buyers see their orders, farmers see orders with their products)',
                    'GET /orders/:orderId': 'Get specific order by ID',
                    'POST /orders/checkout': 'Create order from cart (checkout process)',
                    'PATCH /orders/:orderId/status': 'Update order status (farmers/admins)',
                    'PATCH /orders/:orderId/payment': 'Update payment status (admins)',
                    'GET /orders/stats/summary': 'Get order statistics for current user'
                },
                system: {
                    'GET /health': 'Server health check',
                    'GET /test-db': 'Database connection test',
                    'GET /': 'API information',
                    'GET /dashboard': 'This comprehensive API dashboard'
                }
            },
            queryParameters: {
                pagination: {
                    page: 'Page number (default: 1)',
                    limit: 'Items per page (default: 10, max: 100)'
                },
                search: {
                    search: 'Search term for text fields',
                    category: 'Filter by product category',
                    status: 'Filter by status',
                    role: 'Filter by user role',
                    verified: 'Filter by verification status (true/false)',
                    is_organic: 'Filter organic products (true/false)',
                    min_price: 'Minimum price filter',
                    max_price: 'Maximum price filter',
                    farmer_id: 'Filter products by farmer ID'
                }
            },
            dataModels: {
                user: {
                    id: 'UUID',
                    email: 'string (unique)',
                    name: 'string (optional)',
                    phone: 'string (optional)',
                    location: 'string (optional)',
                    role: 'farmer | buyer',
                    profile_image_url: 'string (optional)',
                    join_date: 'timestamp'
                },
                farmer: {
                    user_id: 'UUID (references users.id)',
                    farm_name: 'string (optional)',
                    farm_address: 'string (optional)',
                    total_sales: 'integer',
                    is_verified: 'boolean'
                },
                buyer: {
                    user_id: 'UUID (references users.id)',
                    total_spent: 'decimal',
                    total_orders: 'integer',
                    delivery_address: 'string (optional)'
                },
                product: {
                    id: 'UUID',
                    farmer_id: 'UUID (references users.id)',
                    title: 'string',
                    description: 'string',
                    price: 'decimal',
                    category: 'rice | fruits | vegetables | herbs | handmade | dairy | meat | other',
                    quantity: 'integer',
                    unit: 'kg | g | pcs | pack | bag | box | bottle | bunch | dozen',
                    image_url: 'string (optional)', status: 'available | outOfStock | discontinued',
                    is_organic: 'boolean',
                    order_count: 'integer'
                },
                cart_item: {
                    id: 'UUID',
                    buyer_id: 'UUID (references users.id)',
                    product_id: 'UUID (references products.id)',
                    quantity: 'integer',
                    created_at: 'timestamp',
                    updated_at: 'timestamp'
                },
                order: {
                    id: 'UUID',
                    buyer_id: 'UUID (references users.id)',
                    order_number: 'string (unique)',
                    total_amount: 'decimal',
                    delivery_address: 'string',
                    payment_method: 'cash_on_delivery | bank_transfer | gcash | paypal',
                    payment_status: 'pending | completed | failed | refunded',
                    status: 'pending | confirmed | preparing | ready_for_pickup | out_for_delivery | delivered | cancelled',
                    notes: 'string (optional)',
                    created_at: 'timestamp',
                    updated_at: 'timestamp',
                    confirmed_at: 'timestamp (optional)',
                    delivered_at: 'timestamp (optional)',
                    cancelled_at: 'timestamp (optional)'
                },
                order_item: {
                    id: 'UUID',
                    order_id: 'UUID (references orders.id)',
                    product_id: 'UUID (references products.id)',
                    quantity: 'integer',
                    unit_price: 'decimal',
                    subtotal: 'decimal',
                    created_at: 'timestamp'
                }
            },
            authentication: {
                method: 'JWT Bearer Token',
                header: 'Authorization: Bearer <token>',
                registration: 'POST /api/users/register',
                login: 'POST /api/users/login',
                tokenExpiry: '7 days'
            }
        };

        res.status(200).json({
            success: true,
            data: apiDocumentation
        });
    } catch (error) {
        console.error('Error generating API dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating API dashboard',
            error: error.message
        });
    }
});

export default router;
