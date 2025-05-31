// Validation middleware for request data

// Validation middleware for user data
export const validateUserData = (req, res, next) => {
    const { email, name, role } = req.body;
    const errors = [];

    // Check required fields
    if (!email || email.trim().length === 0) {
        errors.push('Email is required');
    }

    if (!name || name.trim().length === 0) {
        errors.push('Name is required');
    }

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email format');
    }    // Validate role if provided
    if (role && !['farmer', 'buyer'].includes(role)) {
        errors.push('Role must be one of: farmer, buyer');
    }

    // Check field lengths
    if (name && name.length > 255) {
        errors.push('Name must be less than 255 characters');
    }

    if (email && email.length > 255) {
        errors.push('Email must be less than 255 characters');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors
        });
    }

    next();
};

// Pagination validation middleware
export const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;

    if (page && (!Number.isInteger(+page) || +page < 1)) {
        return res.status(400).json({
            success: false,
            message: 'Page must be a positive integer'
        });
    }

    if (limit && (!Number.isInteger(+limit) || +limit < 1 || +limit > 100)) {
        return res.status(400).json({
            success: false,
            message: 'Limit must be a positive integer between 1 and 100'
        });
    }

    next();
};

// UUID validation middleware
export const validateUUID = (req, res, next) => {
    // Get the first parameter value (could be id, userId, farmerId, etc.)
    const paramValue = Object.values(req.params)[0];
    // More lenient UUID pattern that accepts 0000 segments
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(paramValue)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    next();
};

// Rate limiting middleware (basic implementation)
const requestCounts = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        for (const [key, data] of requestCounts.entries()) {
            if (data.timestamp < windowStart) {
                requestCounts.delete(key);
            }
        }

        // Check current request count
        const currentData = requestCounts.get(ip) || { count: 0, timestamp: now };

        if (currentData.timestamp < windowStart) {
            // Reset if outside window
            currentData.count = 1;
            currentData.timestamp = now;
        } else {
            currentData.count++;
        }

        requestCounts.set(ip, currentData);

        if (currentData.count > maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later'
            });
        }

        next();
    };
};

export default {
    validateUserData,
    validatePagination,
    validateUUID,
    rateLimit
};
