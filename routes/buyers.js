import express from 'express';
import { supabase, dbConfig } from '../config/database.js';
import { validateUUID, validatePagination } from '../middleware/validation.js';
import { authenticateToken, authorizeRole, authorizeOwnerOrAdmin } from '../middleware/auth.js';
import {checkDbConfig} from '../middleware/check_db_config.js';

const router = express.Router();

router.use(checkDbConfig);

// GET all buyers with their user information
router.get('/', validatePagination, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit; let query = supabase
            .from('buyers')
            .select(`
                *,
                users!buyers_user_id_fkey (
                    id,
                    email,
                    name,
                    phone,
                    location,
                    profile_image_url,
                    join_date
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Add search functionality
        if (search) {
            // Search in related user fields through a separate query
            const { data: searchResults } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'buyer')
                .or(`name.ilike.%${search}%,email.ilike.%${search}%,location.ilike.%${search}%`);

            if (searchResults && searchResults.length > 0) {
                const userIds = searchResults.map(u => u.id);
                query = query.in('user_id', userIds);
            } else {
                // No users found, return empty result
                return res.status(200).json({
                    success: true,
                    data: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0
                    }
                });
            }
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
        console.error('Error fetching buyers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buyers',
            error: error.message
        });
    }
});

// GET buyer by ID with user information
router.get('/:id', validateUUID, async (req, res) => {
    try {
        const { id } = req.params; const { data, error } = await supabase
            .from('buyers')
            .select(`
                *,
                users!buyers_user_id_fkey (
                    id,
                    email,
                    name,
                    phone,
                    location,
                    profile_image_url,
                    join_date
                )
            `)
            .eq('user_id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Buyer not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching buyer:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buyer',
            error: error.message
        });
    }
});

// GET buyer by user ID
router.get('/user/:userId', validateUUID, async (req, res) => {
    try {
        const { userId } = req.params; const { data, error } = await supabase
            .from('buyers')
            .select(`
                *,
                users!buyers_user_id_fkey (
                    id,
                    email,
                    name,
                    phone,
                    location,
                    profile_image_url,
                    join_date
                )
            `)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Buyer profile not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching buyer by user ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buyer profile',
            error: error.message
        });
    }
});

// PUT update buyer profile
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
            .from('buyers')
            .update(updateData)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Buyer profile not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Buyer profile updated successfully',
            data: data
        });
    } catch (error) {
        console.error('Error updating buyer profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating buyer profile',
            error: error.message
        });
    }
});

// GET buyer statistics
router.get('/:userId/stats', validateUUID, async (req, res) => {
    try {
        const { userId } = req.params;

        // Get buyer info
        const { data: buyer, error: buyerError } = await supabase
            .from('buyers')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (buyerError) {
            if (buyerError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Buyer not found'
                });
            }
            throw buyerError;
        }

        // Calculate statistics
        const stats = {
            totalSpent: parseFloat(buyer.total_spent),
            totalOrders: buyer.total_orders,
            averageOrderValue: buyer.total_orders > 0 ?
                (parseFloat(buyer.total_spent) / buyer.total_orders) : 0,
            hasDeliveryAddress: !!buyer.delivery_address,
            deliveryAddress: buyer.delivery_address
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching buyer statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buyer statistics',
            error: error.message
        });
    }
});

// GET top buyers by total spent
router.get('/top/spenders', validatePagination, async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const { data, error } = await supabase.from('buyers')
            .select(`
                *,
                users!buyers_user_id_fkey (
                    id,
                    name,
                    email,
                    location,
                    profile_image_url
                )
            `)
            .order('total_spent', { ascending: false })
            .limit(parseInt(limit));

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error fetching top buyers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top buyers',
            error: error.message
        });
    }
});

export default router;
