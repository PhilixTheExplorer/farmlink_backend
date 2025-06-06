import express from 'express';
import { supabase, dbConfig } from '../config/database.js';
import { validateUUID, validatePagination } from '../middleware/validation.js';
import { authenticateToken, authorizeRole, authorizeOwnerOrAdmin } from '../middleware/auth.js';
import { checkDbConfig } from '../middleware/check_db_config.js';

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

        // Separate farmer-specific fields from user fields
        const farmerFields = [
            'farm_name',
            'farm_address',
            'farm_description',
            'established_year',
            'total_sales',
            'is_verified'
        ];

        const userFields = [
            'name',
            'phone',
            'location',
            'profile_image_url'
        ];

        // Extract farmer-specific data
        const farmerUpdateData = {};
        const userUpdateData = {};

        Object.keys(req.body).forEach(key => {
            // Handle description field mapping
            if (key === 'description') {
                farmerUpdateData.farm_description = req.body[key];
            } else if (farmerFields.includes(key)) {
                farmerUpdateData[key] = req.body[key];
            } else if (userFields.includes(key)) {
                userUpdateData[key] = req.body[key];
            }
            // Ignore any other fields
        });

        // Always update the timestamp for farmer
        farmerUpdateData.updated_at = new Date().toISOString();

        let updatedFarmerData = null;
        let updatedUserData = null;

        // Update farmer data if there are farmer-specific fields
        if (Object.keys(farmerUpdateData).length > 1) { // More than just updated_at
            const { data: farmerData, error: farmerError } = await supabase
                .from('farmers')
                .update(farmerUpdateData)
                .eq('user_id', userId)
                .select()
                .single();

            if (farmerError) {
                if (farmerError.code === 'PGRST116') {
                    return res.status(404).json({
                        success: false,
                        message: 'Farmer profile not found'
                    });
                }
                throw farmerError;
            }
            updatedFarmerData = farmerData;
        }

        // Update user data if there are user-specific fields
        if (Object.keys(userUpdateData).length > 0) {
            userUpdateData.updated_at = new Date().toISOString();

            const { data: userData, error: userError } = await supabase
                .from('users')
                .update(userUpdateData)
                .eq('id', userId)
                .select()
                .single();

            if (userError) {
                throw userError;
            }
            updatedUserData = userData;
        }

        // Get the complete updated farmer profile with user information
        const { data: finalData, error: finalError } = await supabase
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

        if (finalError) {
            if (finalError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Farmer profile not found'
                });
            }
            throw finalError;
        }

        res.status(200).json({
            success: true,
            message: 'Farmer profile updated successfully',
            data: finalData
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
