import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase, dbConfig } from '../config/database.js';
import { validateUserData, validateUUID, validatePagination } from '../middleware/validation.js';
import { authenticateToken, authorizeRole, authorizeOwnerOrAdmin } from '../middleware/auth.js';
import { checkDbConfig } from '../middleware/check_db_config.js';

const router = express.Router();

router.use(checkDbConfig);

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Validation middleware for authentication
const validateRegisterData = (req, res, next) => {
    const { email, password, role } = req.body;
    const errors = [];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Valid email is required');
    }

    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    if (!role || !['farmer', 'buyer'].includes(role)) {
        errors.push('Valid role is required (farmer, buyer)');
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

const validateLoginData = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Valid email is required');
    }

    if (!password) {
        errors.push('Password is required');
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

// POST /register - Register a new user
router.post('/register', validateRegisterData, async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create new user
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash,
                role,
            }])
            .select('id, email, role, join_date')
            .single();

        if (userError) throw userError;

        // Create role-specific record with minimal required fields
        let roleData = null;
        if (role === 'farmer') {
            const { data: farmerData, error: farmerError } = await supabase
                .from('farmers')
                .insert([{
                    user_id: userData.id,
                }])
                .select('*')
                .single();

            if (farmerError) throw farmerError;
            roleData = farmerData;
        } else if (role === 'buyer') {
            const { data: buyerData, error: buyerError } = await supabase
                .from('buyers')
                .insert([{
                    user_id: userData.id,
                }])
                .select('*')
                .single();

            if (buyerError) throw buyerError;
            roleData = buyerData;
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: userData.id,
                email: userData.email,
                role: userData.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userData,
                profile: roleData,
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

// POST /login - Login user
router.post('/login', validateLoginData, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, password_hash, name, phone, location, role, profile_image_url, join_date')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Fetch role-specific data
        let roleProfile = null;
        if (user.role === 'farmer') {
            const { data: farmerData } = await supabase
                .from('farmers')
                .select('*')
                .eq('user_id', user.id)
                .single();
            roleProfile = farmerData;
        } else if (user.role === 'buyer') {
            const { data: buyerData } = await supabase
                .from('buyers')
                .select('*')
                .eq('user_id', user.id)
                .single();
            roleProfile = buyerData;
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password hash from response
        const { password_hash, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                profile: roleProfile,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
});

// GET all users
router.get('/', authenticateToken, authorizeRole('admin'), validatePagination, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .order('join_date', { ascending: false })
            .range(offset, offset + limit - 1);

        // Add search functionality
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,location.ilike.%${search}%`);
        }

        // Filter by role if provided
        if (role) {
            query = query.eq('role', role);
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
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// GET user by ID
router.get('/:id', authenticateToken, authorizeOwnerOrAdmin, validateUUID, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// GET users by role
router.get('/role/:role', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { role } = req.params;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', role)
            .order('join_date', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            data: data,
            count: data.length
        });
    } catch (error) {
        console.error('Error fetching users by role:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users by role',
            error: error.message
        });
    }
});

// POST create new user
router.post('/', authenticateToken, authorizeRole('admin'), validateUserData, async (req, res) => {
    try {
        const userData = {
            ...req.body,
            join_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: data
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// PUT update user
router.put('/:id', authenticateToken, authorizeOwnerOrAdmin, validateUUID, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        // Remove fields that shouldn't be updated
        delete updateData.id;
        delete updateData.join_date;
        delete updateData.created_at;

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: data
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// DELETE user
router.delete('/:id', authenticateToken, authorizeOwnerOrAdmin, validateUUID, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// POST insert sample data (for development/testing only)
router.post('/seed-data', async (req, res) => {
    try {
        // Import the SeedManager dynamically to avoid circular dependencies
        const { default: SeedManager } = await import('../database/seed/seedManager.js');

        // Parse options from request body
        const options = {
            farmers: req.body.farmers !== false, // default to true
            buyers: req.body.buyers !== false // default to true
        };

        // Use the SeedManager to seed data
        const result = await SeedManager.seedAll(options);

        res.status(201).json({
            success: true,
            message: 'Sample data inserted successfully',
            data: result.data,
            summary: result.summary
        });
    } catch (error) {
        console.error('Error inserting sample data:', error);
        res.status(500).json({
            success: false,
            message: 'Error inserting sample data',
            error: error.message
        });
    }
});

export default router;
