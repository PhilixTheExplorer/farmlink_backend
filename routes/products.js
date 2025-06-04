import express from 'express';
import { supabase } from '../config/database.js';
import { validateUUID, validatePagination } from '../middleware/validation.js';
import { authenticateToken, authorizeRole, authorizeFarmerProduct } from '../middleware/auth.js';
import { checkDbConfig } from '../middleware/check_db_config.js';

const router = express.Router();

router.use(checkDbConfig);

// Validation middleware for product data
const validateProductData = (req, res, next) => {
    const { title, price, category, quantity, unit } = req.body;
    const errors = [];

    if (!title || title.trim().length === 0) {
        errors.push('Product title is required');
    }

    if (!price || isNaN(price) || parseFloat(price) < 0) {
        errors.push('Valid price is required (must be >= 0)');
    }

    if (!category) {
        errors.push('Product category is required');
    }

    if (quantity === undefined || isNaN(quantity) || parseInt(quantity) < 0) {
        errors.push('Valid quantity is required (must be >= 0)');
    }

    if (!unit) {
        errors.push('Product unit is required');
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

// GET all products with farmer information
router.get('/', validatePagination, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            category = '',
            status = '',
            farmer_id = '',
            min_price = '',
            max_price = ''
        } = req.query;

        const offset = (page - 1) * limit; let query = supabase
            .from('products').select(`
                *,
                farmer_user:farmer_id (
                    id,
                    name,
                    email,
                    location,
                    profile_image_url,
                    farmers (
                        farm_name,
                        farm_address,
                        is_verified
                    )
                )
            `, { count: 'exact' })
            .order('created_date', { ascending: false })
            .range(offset, offset + limit - 1);

        // Add filters
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        if (category) {
            query = query.eq('category', category);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (farmer_id) {
            query = query.eq('farmer_id', farmer_id);
        }

        if (min_price) {
            query = query.gte('price', parseFloat(min_price));
        }

        if (max_price) {
            query = query.lte('price', parseFloat(max_price));
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
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

// GET product by ID with farmer information
router.get('/:id', validateUUID, async (req, res) => {
    try {
        const { id } = req.params; const { data, error } = await supabase
            .from('products').select(`
                *,
                farmer_user:farmer_id (
                    id,
                    name,
                    email,
                    phone,
                    location,
                    profile_image_url,
                    farmers (
                        farm_name,
                        farm_address,
                        is_verified
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

// GET products by farmer ID
router.get('/farmer/:farmerId', validateUUID, validatePagination, async (req, res) => {
    try {
        const { farmerId } = req.params;
        const { page = 1, limit = 10, status = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('farmer_id', farmerId)
            .order('created_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
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
        console.error('Error fetching farmer products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching farmer products',
            error: error.message
        });
    }
});

// GET products by category
router.get('/category/:category', validatePagination, async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 10, status = 'available' } = req.query;
        const offset = (page - 1) * limit; let query = supabase
            .from('products')
            .select(`
                *,
                farmer_user:farmer_id (
                    id,
                    name,
                    location,
                    farmers (
                        farm_name,
                        is_verified
                    )
                )
            `, { count: 'exact' })
            .eq('category', category)
            .order('created_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
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
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products by category',
            error: error.message
        });
    }
});

// POST create new product
router.post('/', authenticateToken, authorizeRole('farmer'), validateProductData, async (req, res) => {
    try {
        const productData = {
            ...req.body,
            farmer_id: req.user.userId, // Use authenticated farmer's ID
            created_date: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: data
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

// PUT update product
router.put('/:id', authenticateToken, authorizeFarmerProduct, validateUUID, validateProductData, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            last_updated: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Remove fields that shouldn't be updated
        delete updateData.id;
        delete updateData.farmer_id;
        delete updateData.created_date;
        delete updateData.created_at;
        delete updateData.order_count;

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: data
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
});

// PATCH update product status
router.patch('/:id/status', authenticateToken, authorizeFarmerProduct, validateUUID, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['available', 'outOfStock', 'discontinued'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required (available, outOfStock, discontinued)'
            });
        }

        const { data, error } = await supabase
            .from('products')
            .update({
                status,
                last_updated: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Product status updated successfully',
            data: data
        });
    } catch (error) {
        console.error('Error updating product status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product status',
            error: error.message
        });
    }
});

// PATCH update product quantity
router.patch('/:id/quantity', authenticateToken, authorizeFarmerProduct, validateUUID, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || isNaN(quantity) || parseInt(quantity) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required (must be >= 0)'
            });
        }

        const updateData = {
            quantity: parseInt(quantity),
            last_updated: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Auto-update status based on quantity
        if (parseInt(quantity) === 0) {
            updateData.status = 'outOfStock';
        } else {
            updateData.status = 'available';
        }

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Product quantity updated successfully',
            data: data
        });
    } catch (error) {
        console.error('Error updating product quantity:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product quantity',
            error: error.message
        });
    }
});

// DELETE product
router.delete('/:id', authenticateToken, authorizeFarmerProduct, validateUUID, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
});

// GET product categories
router.get('/meta/categories', async (req, res) => {
    try {
        const categories = [
            'rice', 'fruits', 'vegetables', 'herbs',
            'handmade', 'dairy', 'meat', 'other'
        ];

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
});

// GET product units
router.get('/meta/units', async (req, res) => {
    try {
        const units = [
            'kg', 'g', 'pcs', 'pack', 'bag',
            'box', 'bottle', 'bunch', 'dozen'
        ];

        res.status(200).json({
            success: true,
            data: units
        });
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching units',
            error: error.message
        });
    }
});

// GET featured products (top rated or most ordered)
router.get('/featured/popular', validatePagination, async (req, res) => {
    try {
        const { limit = 10 } = req.query; const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                farmer_user:farmer_id (
                    id,
                    name,
                    location,
                    farmers (
                        farm_name,
                        is_verified
                    )
                )
            `)
            .eq('status', 'available')
            .order('order_count', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error fetching popular products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching popular products',
            error: error.message
        });
    }
});

// POST seed products with sample data
router.post('/seed', async (req, res) => {
    try {
        // Import the SeedManager dynamically
        const { default: SeedManager } = await import('../database/seed/seedManager.js');

        // Add products seeding method to SeedManager if it doesn't exist
        const result = await SeedManager.seedProducts();

        res.status(201).json({
            success: true,
            message: 'Product sample data seeded successfully',
            data: result
        });
    } catch (error) {
        console.error('Error seeding products:', error);
        res.status(500).json({
            success: false,
            message: 'Error seeding products',
            error: error.message
        });
    }
});

export default router;
