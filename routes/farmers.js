import express from 'express';
import { supabase, dbConfig } from '../config/database.js';
import { validateUUID, validatePagination } from '../middleware/validation.js';
import { authenticateToken, authorizeRole, authorizeOwnerOrAdmin } from '../middleware/auth.js';
import {checkDbConfig} from '../middleware/check_db_config.js';

const router = express.Router();

router.use(checkDbConfig);

// GET all farmers with their user information
router.get('/', validatePagination, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', verified = '' } = req.query;
        const offset = (page - 1) * limit; let query = supabase
            .from('farmers')
            .select(`
                *,
                users!farmers_user_id_fkey (
                    id,
                    email,
                    name,
                    phone,
                    location,
                    profile_image_url
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Filter by verification status if provided
        if (verified !== '') {
            query = query.eq('is_verified', verified === 'true');
        }

        // Add search functionality
        if (search) {
            query = query.or(`farm_name.ilike.%${search}%,farm_address.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error; res.status(200).json({
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
        console.error('Error fetching farmers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching farmers',
            error: error.message
        });
    }
});

// GET farmer by ID with user information
router.get('/:id', validateUUID, async (req, res) => {
    try {
        const { id } = req.params; const { data, error } = await supabase
            .from('farmers')
            .select(`
                *,
                users!farmers_user_id_fkey (
                    id,
                    email,
                    name,
                    phone,
                    location,
                    profile_image_url
                )
            `)
            .eq('user_id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Farmer not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching farmer:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching farmer',
            error: error.message
        });
    }
});

// GET farmer by user ID
router.get('/user/:userId', validateUUID, async (req, res) => {
    try {
        const { userId } = req.params; const { data, error } = await supabase
            .from('farmers')
            .select(`
                *,
                users!farmers_user_id_fkey (
                    id,
                    email,
                    name,
                    phone,
                    location,
                    profile_image_url
                )
            `)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Farmer profile not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching farmer by user ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching farmer profile',
            error: error.message
        });
    }
});

// PUT update farmer profile
router.put('/:userId', authenticateToken, authorizeOwnerOrAdmin, validateUUID, async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        // Remove fields that shouldn't be updated
        delete updateData.id;
        delete updateData.user_id;
        delete updateData.created_at;

        const { data, error } = await supabase
            .from('farmers')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Farmer profile not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Farmer profile updated successfully',
            data: data
        });
    } catch (error) {
        console.error('Error updating farmer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating farmer profile',
            error: error.message
        });
    }
});

// PATCH verify farmer
router.patch('/:userId/verify', authenticateToken, authorizeRole('admin'), validateUUID, async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_verified } = req.body;

        if (typeof is_verified !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'is_verified must be a boolean value'
            });
        }

        const { data, error } = await supabase
            .from('farmers')
            .update({
                is_verified,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Farmer not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: `Farmer ${is_verified ? 'verified' : 'unverified'} successfully`,
            data: data
        });
    } catch (error) {
        console.error('Error updating farmer verification:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating farmer verification',
            error: error.message
        });
    }
});

// GET farmer statistics
router.get('/:userId/stats', validateUUID, async (req, res) => {
    try {
        const { userId } = req.params;

        // Get farmer info
        const { data: farmer, error: farmerError } = await supabase
            .from('farmers')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (farmerError) {
            if (farmerError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Farmer not found'
                });
            }
            throw farmerError;
        }

        // Get product statistics
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, status, category, quantity, order_count')
            .eq('farmer_id', userId);

        if (productsError) throw productsError;

        // Calculate statistics
        const stats = {
            totalProducts: products.length,
            availableProducts: products.filter(p => p.status === 'available').length,
            outOfStockProducts: products.filter(p => p.status === 'outOfStock').length,
            totalSales: farmer.total_sales,
            totalOrders: products.reduce((sum, p) => sum + p.order_count, 0),
            productsByCategory: products.reduce((acc, p) => {
                acc[p.category] = (acc[p.category] || 0) + 1;
                return acc;
            }, {}),
            isVerified: farmer.is_verified
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching farmer statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching farmer statistics',
            error: error.message
        });
    }
});

export default router;
