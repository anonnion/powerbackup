// Error handling middleware for PowerBackup API
import { log } from '../../utils/logger.js';

/**
 * Global error handler middleware
 * Provides consistent error responses and logging
 */
export function errorHandler(err, req, res, next) {
    // Log the error
    log.error(`API Error: ${err.message}`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: err.stack
    });

    // Determine error type and status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    let errorDetails = null;

    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorMessage = 'Validation error';
        errorDetails = err.details;
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        errorMessage = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        errorMessage = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        errorMessage = 'Resource not found';
    } else if (err.name === 'ConflictError') {
        statusCode = 409;
        errorMessage = 'Resource conflict';
    } else if (err.name === 'RateLimitError') {
        statusCode = 429;
        errorMessage = 'Too many requests';
    } else if (err.code === 'ENOENT') {
        statusCode = 404;
        errorMessage = 'File or directory not found';
    } else if (err.code === 'EACCES') {
        statusCode = 403;
        errorMessage = 'Permission denied';
    } else if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        errorMessage = 'Service unavailable';
    } else if (err.message && err.message.includes('validation')) {
        statusCode = 400;
        errorMessage = 'Invalid input data';
        errorDetails = err.message;
    }

    // Create error response
    const errorResponse = {
        error: errorMessage,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        requestId: req.headers['x-request-id'] || generateRequestId()
    };

    // Add details if available
    if (errorDetails) {
        errorResponse.details = errorDetails;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
}

/**
 * Generate request ID
 * @returns {string} Request ID
 */
function generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}

export class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
    }
}

export class RateLimitError extends Error {
    constructor(message = 'Too many requests') {
        super(message);
        this.name = 'RateLimitError';
    }
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Validate required fields
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Required field names
 * @throws {ValidationError} If required fields are missing
 */
export function validateRequired(data, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missing.push(field);
        }
    }
    
    if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }
}

/**
 * Validate field types
 * @param {Object} data - Data to validate
 * @param {Object} fieldTypes - Field type definitions
 * @throws {ValidationError} If field types are invalid
 */
export function validateFieldTypes(data, fieldTypes) {
    const errors = [];
    
    for (const [field, expectedType] of Object.entries(fieldTypes)) {
        if (data[field] !== undefined) {
            const actualType = typeof data[field];
            
            if (actualType !== expectedType) {
                errors.push(`${field} must be ${expectedType}, got ${actualType}`);
            }
        }
    }
    
    if (errors.length > 0) {
        throw new ValidationError('Invalid field types', errors);
    }
}


