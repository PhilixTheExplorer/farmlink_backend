import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { checkDbConfig } from '../middleware/check_db_config.js';

const router = express.Router();

router.use(checkDbConfig);

// Validation middleware for cart items
const validateCartItemData = (req, res, next) => {
    const { product_id, quantity } = req.body;
    const errors = [];

    if (!product_id) {
        errors.push('Product ID is required');
    }

    if (quantity === undefined || isNaN(quantity) || parseInt(quantity) <= 0) {
        errors.push('Valid quantity is required (must be > 0)');
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

// GET current user's cart items
router.get('/', authenticateToken, authorizeRole('buyer'), async (req, res) => {
    try {
        const { userId } = req.user;
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                *,  products:product_id (
                    id,
                    title,
                    description,
                    price,
                    category,
                    unit,
                    image_url,
                    status,
                    quantity,
                    farmer_user:farmer_id (
                        name,
                        location,
                        farmers (
                            farm_name,
                            is_verified
                        )
                    )
                )
            `)
            .eq('buyer_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate totals
        let subtotal = 0;
        const validItems = data.filter(item => {
            if (item.products && item.products.status === 'available') {
                subtotal += parseFloat(item.products.price) * item.quantity;
                return true;
            }
            return false;
        });

        const cartSummary = {
            items: validItems,
            itemCount: validItems.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: subtotal,
            total: subtotal // Can add tax, shipping fees later
        };

        res.status(200).json({
            success: true,
            data: cartSummary
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
});

// POST add item to cart
router.post('/items', authenticateToken, authorizeRole('buyer'), validateCartItemData, async (req, res) => {
    try {
        const { userId } = req.user;
        const { product_id, quantity } = req.body;        // Check if product exists and is available
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, title, price, quantity, status, farmer_id')
            .eq('id', product_id)
            .single();

        if (productError) {
            if (productError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            throw productError;
        }

        if (product.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Product is not available for purchase'
            });
        } if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.quantity} items available in stock`
            });
        }

        // Prevent buyers from adding their own products to cart
        if (product.farmer_id === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot add your own products to cart'
            });
        }

        // Check if item already exists in cart
        const { data: existingItem, error: existingError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('buyer_id', userId)
            .eq('product_id', product_id)
            .single();

        if (existingError && existingError.code !== 'PGRST116') {
            throw existingError;
        }

        let cartItem;
        if (existingItem) {
            // Update existing item quantity
            const newQuantity = existingItem.quantity + quantity; if (newQuantity > product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add ${quantity} more items. Only ${product.quantity - existingItem.quantity} more items can be added.`
                });
            }

            const { data, error } = await supabase
                .from('cart_items')
                .update({
                    quantity: newQuantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingItem.id)
                .select()
                .single();

            if (error) throw error;
            cartItem = data;
        } else {
            // Create new cart item
            const { data, error } = await supabase
                .from('cart_items')
                .insert([{
                    buyer_id: userId,
                    product_id,
                    quantity,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            cartItem = data;
        }

        res.status(201).json({
            success: true,
            message: `${product.title} added to cart successfully`,
            data: cartItem
        });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message
        });
    }
});

// PUT update cart item quantity
router.put('/items/:itemId', authenticateToken, authorizeRole('buyer'), async (req, res) => {
    try {
        const { userId } = req.user;
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || isNaN(quantity) || parseInt(quantity) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required (must be > 0)'
            });
        }

        // Check if cart item exists and belongs to user
        const { data: cartItem, error: cartError } = await supabase
            .from('cart_items').select(`
                *,
                products:product_id (
                    title,
                    quantity,
                    status
                )
            `)
            .eq('id', itemId)
            .eq('buyer_id', userId)
            .single();

        if (cartError) {
            if (cartError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }
            throw cartError;
        }

        if (cartItem.products.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Product is no longer available'
            });
        } if (cartItem.products.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${cartItem.products.quantity} items available in stock`
            });
        }

        // Update cart item quantity
        const { data, error } = await supabase
            .from('cart_items')
            .update({
                quantity: parseInt(quantity),
                updated_at: new Date().toISOString()
            })
            .eq('id', itemId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Cart item updated successfully',
            data: data
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cart item',
            error: error.message
        });
    }
});

// DELETE remove item from cart
router.delete('/items/:itemId', authenticateToken, authorizeRole('buyer'), async (req, res) => {
    try {
        const { userId } = req.user;
        const { itemId } = req.params;

        const { data, error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId)
            .eq('buyer_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Cart item not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing cart item',
            error: error.message
        });
    }
});

// DELETE clear entire cart
router.delete('/clear', authenticateToken, authorizeRole('buyer'), async (req, res) => {
    try {
        const { userId } = req.user;

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('buyer_id', userId);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
});

// GET cart summary (item count and total)
router.get('/summary', authenticateToken, authorizeRole('buyer'), async (req, res) => {
    try {
        const { userId } = req.user;

        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                quantity,
                products:product_id (
                    price,
                    status
                )
            `)
            .eq('buyer_id', userId);

        if (error) throw error;

        const validItems = data.filter(item => item.products && item.products.status === 'available');
        const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = validItems.reduce((sum, item) => sum + (parseFloat(item.products.price) * item.quantity), 0);

        res.status(200).json({
            success: true,
            data: {
                itemCount,
                subtotal,
                total: subtotal
            }
        });
    } catch (error) {
        console.error('Error fetching cart summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart summary',
            error: error.message
        });
    }
});

export default router;
