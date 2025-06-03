import express from 'express';
import { supabase } from '../config/database.js';
import { validateUUID, validatePagination } from '../middleware/validation.js';
import { authenticateToken, authorizeRole, authorizeOwnerOrAdmin } from '../middleware/auth.js';
import { checkDbConfig } from '../middleware/check_db_config.js';

const router = express.Router();

router.use(checkDbConfig);

// Validation middleware for order data
const validateOrderData = (req, res, next) => {
    const { delivery_address, payment_method } = req.body;
    const errors = [];

    if (!delivery_address || delivery_address.trim().length === 0) {
        errors.push('Delivery address is required');
    }

    if (!payment_method || !['cash_on_delivery', 'bank_transfer', 'gcash', 'paypal'].includes(payment_method)) {
        errors.push('Valid payment method is required (cash_on_delivery, bank_transfer, gcash, paypal)');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors
        });
    }

    next();
};

// GET orders for current user (buyers see their orders, farmers see orders for their products)
router.get('/', authenticateToken, validatePagination, async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { page = 1, limit = 10, status = '', farmer_id = '' } = req.query;
        const offset = (page - 1) * limit;

        let query;
        if (role === 'buyer') {
            // Buyers see their orders
            query = supabase
                .from('orders')
                .select(`
                    *,
                    order_items:order_items (
                        *,
                        products:product_id (
                            id,
                            title,
                            image_url,
                            unit,
                            farmers:farmer_id (
                                farm_name,
                                users!farmers_user_id_fkey (
                                    name,
                                    phone
                                )
                            )
                        )
                    )
                `, { count: 'exact' })
                .eq('buyer_id', userId);
        } else if (role === 'farmer') {
            // Farmers see orders containing their products
            query = supabase
                .from('orders')
                .select(`
                    *,
                    order_items:order_items!inner (
                        *,
                        products:product_id!inner (
                            id,
                            title,
                            image_url,
                            unit
                        )
                    ),
                    buyers:buyer_id (
                        delivery_address,
                        users!buyers_user_id_fkey (
                            name,
                            phone,
                            email
                        )
                    )
                `, { count: 'exact' })
                .eq('order_items.products.farmer_id', userId);
        } else {
            // Admins see all orders
            query = supabase
                .from('orders')
                .select(`
                    *,
                    order_items:order_items (
                        *,
                        products:product_id (
                            title,
                            farmers:farmer_id (
                                farm_name,
                                users!farmers_user_id_fkey (
                                    name
                                )
                            )
                        )
                    ),
                    buyers:buyer_id (
                        users!buyers_user_id_fkey (
                            name,
                            email
                        )
                    )
                `, { count: 'exact' });
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Add filters
        if (status) {
            query = query.eq('status', status);
        }

        if (farmer_id && role === 'admin') {
            query = query.eq('order_items.products.farmer_id', farmer_id);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

// GET specific order by ID
router.get('/:orderId', authenticateToken, validateUUID, async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { orderId } = req.params;

        let query = supabase
            .from('orders')
            .select(`
                *,
                order_items:order_items (
                    *,
                    products:product_id (
                        id,
                        title,
                        description,
                        image_url,
                        unit,
                        category,
                        farmers:farmer_id (
                            farm_name,
                            farm_address,
                            users!farmers_user_id_fkey (
                                name,
                                phone,
                                email
                            )
                        )
                    )
                ),
                buyers:buyer_id (
                    delivery_address,
                    users!buyers_user_id_fkey (
                        name,
                        phone,
                        email,
                        location
                    )
                )
            `)
            .eq('id', orderId)
            .single();

        const { data: order, error } = await query;

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            throw error;
        }

        // Authorization check
        if (role === 'buyer' && order.buyer_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own orders.'
            });
        }

        if (role === 'farmer') {
            // Check if farmer has products in this order
            const hasProducts = order.order_items.some(item =>
                item.products.farmers.users.id === userId
            );

            if (!hasProducts) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. This order does not contain your products.'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
});

// POST create order from cart (checkout)
router.post('/checkout', authenticateToken, authorizeRole('buyer'), validateOrderData, async (req, res) => {
    try {
        const { userId } = req.user;
        const { delivery_address, payment_method, notes } = req.body;

        // Get cart items
        const { data: cartItems, error: cartError } = await supabase
            .from('cart_items')
            .select(`
                *,
                products:product_id (
                    id,
                    title,
                    price,
                    quantity as available_quantity,
                    status,
                    farmer_id
                )
            `)
            .eq('buyer_id', userId);

        if (cartError) throw cartError;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Validate cart items availability and calculate total
        let totalAmount = 0;
        const validItems = [];
        const unavailableItems = [];

        for (const item of cartItems) {
            if (!item.products || item.products.status !== 'available') {
                unavailableItems.push({
                    product_id: item.product_id,
                    reason: 'Product is no longer available'
                });
                continue;
            }

            if (item.products.available_quantity < item.quantity) {
                unavailableItems.push({
                    product_id: item.product_id,
                    product_title: item.products.title,
                    requested: item.quantity,
                    available: item.products.available_quantity,
                    reason: 'Insufficient stock'
                });
                continue;
            }

            validItems.push(item);
            totalAmount += parseFloat(item.products.price) * item.quantity;
        }

        if (unavailableItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some items in your cart are no longer available',
                unavailable_items: unavailableItems
            });
        }

        if (validItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid items in cart'
            });
        }

        // Create order
        const orderData = {
            buyer_id: userId,
            order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            total_amount: totalAmount,
            delivery_address,
            payment_method,
            payment_status: payment_method === 'cash_on_delivery' ? 'pending' : 'pending',
            status: 'pending',
            notes: notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([orderData])
            .select()
            .single();

        if (orderError) throw orderError;

        // Create order items and update product quantities
        const orderItems = [];
        for (const item of validItems) {
            // Create order item
            const orderItemData = {
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: parseFloat(item.products.price),
                subtotal: parseFloat(item.products.price) * item.quantity,
                created_at: new Date().toISOString()
            };

            const { data: orderItem, error: itemError } = await supabase
                .from('order_items')
                .insert([orderItemData])
                .select()
                .single();

            if (itemError) throw itemError;
            orderItems.push(orderItem);

            // Update product quantity and order count
            const newQuantity = item.products.available_quantity - item.quantity;
            const newStatus = newQuantity === 0 ? 'outOfStock' : 'available';

            const { error: updateError } = await supabase
                .from('products')
                .update({
                    quantity: newQuantity,
                    status: newStatus,
                    order_count: (item.products.order_count || 0) + 1,
                    last_updated: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', item.product_id);

            if (updateError) throw updateError;
        }

        // Clear cart
        const { error: clearCartError } = await supabase
            .from('cart_items')
            .delete()
            .eq('buyer_id', userId);

        if (clearCartError) throw clearCartError;

        // Update buyer statistics
        const { data: buyer, error: buyerError } = await supabase
            .from('buyers')
            .select('total_spent, total_orders')
            .eq('user_id', userId)
            .single();

        if (!buyerError && buyer) {
            await supabase
                .from('buyers')
                .update({
                    total_spent: (parseFloat(buyer.total_spent) || 0) + totalAmount,
                    total_orders: (buyer.total_orders || 0) + 1,
                    delivery_address: delivery_address,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);
        }

        // Update farmer sales statistics
        const farmerSales = {};
        for (const item of validItems) {
            const farmerId = item.products.farmer_id;
            const itemTotal = parseFloat(item.products.price) * item.quantity;

            if (farmerSales[farmerId]) {
                farmerSales[farmerId] += itemTotal;
            } else {
                farmerSales[farmerId] = itemTotal;
            }
        }

        for (const [farmerId, salesAmount] of Object.entries(farmerSales)) {
            const { data: farmer } = await supabase
                .from('farmers')
                .select('total_sales')
                .eq('user_id', farmerId)
                .single();

            if (farmer) {
                await supabase
                    .from('farmers')
                    .update({
                        total_sales: (farmer.total_sales || 0) + salesAmount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', farmerId);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: order,
                order_items: orderItems,
                summary: {
                    item_count: validItems.length,
                    total_amount: totalAmount,
                    order_number: order.order_number
                }
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
});

// PATCH update order status (for farmers and admins)
router.patch('/:orderId/status', authenticateToken, validateUUID, async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Valid status is required. Available statuses: ${validStatuses.join(', ')}`
            });
        }

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items:order_items (
                    products:product_id (
                        farmer_id
                    )
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError) {
            if (orderError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            throw orderError;
        }

        // Authorization check
        if (role === 'farmer') {
            // Check if farmer has products in this order
            const hasProducts = order.order_items.some(item =>
                item.products.farmer_id === userId
            );

            if (!hasProducts) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only update orders containing your products.'
                });
            }
        } else if (role === 'buyer') {
            // Buyers can only cancel their own pending orders
            if (order.buyer_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only update your own orders.'
                });
            }

            if (status !== 'cancelled' || order.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Buyers can only cancel pending orders'
                });
            }
        }

        // Update order status
        const updateData = {
            status,
            updated_at: new Date().toISOString()
        };

        // Add status-specific timestamps
        if (status === 'confirmed') {
            updateData.confirmed_at = new Date().toISOString();
        } else if (status === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
            updateData.payment_status = 'completed';
        } else if (status === 'cancelled') {
            updateData.cancelled_at = new Date().toISOString();
            // TODO: Restore product quantities if cancelled
        }

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            data: data
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
});

// PATCH update payment status
router.patch('/:orderId/payment', authenticateToken, authorizeRole('admin'), validateUUID, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { payment_status } = req.body;

        const validPaymentStatuses = ['pending', 'completed', 'failed', 'refunded'];

        if (!payment_status || !validPaymentStatuses.includes(payment_status)) {
            return res.status(400).json({
                success: false,
                message: `Valid payment status is required. Available statuses: ${validPaymentStatuses.join(', ')}`
            });
        }

        const { data, error } = await supabase
            .from('orders')
            .update({
                payment_status,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: `Payment status updated to ${payment_status}`,
            data: data
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment status',
            error: error.message
        });
    }
});

// GET order statistics for current user
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        const { userId, role } = req.user;

        let stats = {};

        if (role === 'buyer') {
            // Buyer order statistics
            const { data: orders, error } = await supabase
                .from('orders')
                .select('status, total_amount, created_at')
                .eq('buyer_id', userId);

            if (error) throw error;

            stats = {
                totalOrders: orders.length,
                totalSpent: orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0),
                pendingOrders: orders.filter(o => o.status === 'pending').length,
                completedOrders: orders.filter(o => o.status === 'delivered').length,
                cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
                ordersByStatus: orders.reduce((acc, order) => {
                    acc[order.status] = (acc[order.status] || 0) + 1;
                    return acc;
                }, {})
            };
        } else if (role === 'farmer') {
            // Farmer order statistics
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    status,
                    total_amount,
                    created_at,
                    order_items:order_items!inner (
                        subtotal,
                        products:product_id!inner (
                            farmer_id
                        )
                    )
                `)
                .eq('order_items.products.farmer_id', userId);

            if (error) throw error;

            const farmerRevenue = orders.reduce((sum, order) => {
                const farmerItems = order.order_items.filter(item => item.products.farmer_id === userId);
                return sum + farmerItems.reduce((itemSum, item) => itemSum + parseFloat(item.subtotal), 0);
            }, 0);

            stats = {
                totalOrders: orders.length,
                totalRevenue: farmerRevenue,
                pendingOrders: orders.filter(o => o.status === 'pending').length,
                activeOrders: orders.filter(o => ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status)).length,
                completedOrders: orders.filter(o => o.status === 'delivered').length,
                ordersByStatus: orders.reduce((acc, order) => {
                    acc[order.status] = (acc[order.status] || 0) + 1;
                    return acc;
                }, {})
            };
        }

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching order statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order statistics',
            error: error.message
        });
    }
});

export default router;
