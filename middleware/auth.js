import jwt from 'jsonwebtoken';
import { supabase } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

// Authentication middleware to verify JWT tokens
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token is required'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        req.user = user; // Add user info to request object
        next();
    });
};

// Authorization middleware to check user roles
export const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

// Middleware to verify user owns the resource or is admin
export const authorizeOwnerOrAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const { userId, id } = req.params;
        const requestUserId = userId || id;

        // Allow access if user is accessing their own data
        if (req.user.userId === requestUserId) {
            return next();
        }

        // For future admin role implementation
        if (req.user.role === 'admin') {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own data'
        });

    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization error',
            error: error.message
        });
    }
};

// Middleware to verify farmer ownership of products
export const authorizeFarmerProduct = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.role !== 'farmer') {
            return res.status(403).json({
                success: false,
                message: 'Only farmers can manage products'
            });
        }

        const { id } = req.params;

        // Check if the product belongs to the authenticated farmer
        const { data: product, error } = await supabase
            .from('products')
            .select('farmer_id')
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

        if (product.farmer_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only manage your own products'
            });
        }

        next();

    } catch (error) {
        console.error('Product authorization error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization error',
            error: error.message
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

// Middleware to refresh token if it's close to expiry
export const refreshTokenIfNeeded = (req, res, next) => {
    if (!req.user) {
        return next();
    }

    const tokenExp = req.user.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = tokenExp - now;
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // If token expires in less than 24 hours, include new token in response
    if (timeUntilExpiry < oneDayInMs) {
        const newToken = jwt.sign(
            {
                userId: req.user.userId,
                email: req.user.email,
                role: req.user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Add new token to response headers
        res.setHeader('X-New-Token', newToken);
    }

    next();
};

export default {
    authenticateToken,
    authorizeRole,
    authorizeOwnerOrAdmin,
    authorizeFarmerProduct,
    optionalAuth,
    refreshTokenIfNeeded
};
