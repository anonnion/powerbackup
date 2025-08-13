// Input validation middleware for PowerBackup API
import { log } from '../../utils/logger.js';

/**
 * Input validation middleware
 * Sanitizes and validates all API inputs
 */
export function validationMiddleware(req, res, next) {
    try {
        // Sanitize request body
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }

        // Validate content type for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const contentType = req.get('Content-Type');
            if (!contentType || !contentType.includes('application/json')) {
                return res.status(400).json({
                    error: 'Invalid content type',
                    message: 'Content-Type must be application/json'
                });
            }
        }

        next();
    } catch (error) {
        log.error('Validation error:', error.message);
        return res.status(400).json({
            error: 'Invalid request data',
            message: error.message
        });
    }
}

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = sanitizeString(key);
        
        if (typeof value === 'string') {
            sanitized[sanitizedKey] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[sanitizedKey] = sanitizeObject(value);
        } else {
            sanitized[sanitizedKey] = value;
        }
    }

    return sanitized;
}

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
    if (typeof str !== 'string') {
        return str;
    }

    // Remove null bytes and control characters
    let sanitized = str.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Limit length to prevent DoS
    if (sanitized.length > 10000) {
        sanitized = sanitized.substring(0, 10000);
    }

    return sanitized;
}

/**
 * Validate database name
 * @param {string} name - Database name
 * @returns {boolean} True if valid
 */
export function validateDatabaseName(name) {
    if (!name || typeof name !== 'string') {
        return false;
    }
    
    // Database name should be alphanumeric with hyphens and underscores
    return /^[a-zA-Z0-9_-]+$/.test(name) && name.length <= 64;
}

/**
 * Validate database type
 * @param {string} type - Database type
 * @returns {boolean} True if valid
 */
export function validateDatabaseType(type) {
    return ['mysql', 'postgres'].includes(type);
}

/**
 * Validate database URL
 * @param {string} url - Database URL
 * @returns {boolean} True if valid
 */
export function validateDatabaseURL(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    try {
        const urlObj = new URL(url);
        return ['mysql:', 'postgresql:', 'postgres:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}

/**
 * Validate backup tier
 * @param {string} tier - Backup tier
 * @returns {boolean} True if valid
 */
export function validateBackupTier(tier) {
    return ['hourly', 'daily', 'weekly', 'monthly', 'yearly'].includes(tier);
}

/**
 * Validate table name
 * @param {string} table - Table name
 * @returns {boolean} True if valid
 */
export function validateTableName(table) {
    if (!table || typeof table !== 'string') {
        return false;
    }
    
    // Table name should be alphanumeric with underscores
    return /^[a-zA-Z0-9_]+$/.test(table) && table.length <= 64;
}

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validated parameters
 */
export function validatePagination(params) {
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    
    return {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit))
    };
}

/**
 * Validate date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {boolean} True if valid
 */
export function validateDateRange(startDate, endDate) {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return false;
        }
        
        return start <= end;
    } catch {
        return false;
    }
}

/**
 * Validate file path
 * @param {string} filePath - File path
 * @returns {boolean} True if valid
 */
export function validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        return false;
    }
    
    // Prevent directory traversal
    if (filePath.includes('..') || filePath.includes('//')) {
        return false;
    }
    
    // Only allow alphanumeric, hyphens, underscores, dots, and slashes
    return /^[a-zA-Z0-9._/-]+$/.test(filePath);
}

