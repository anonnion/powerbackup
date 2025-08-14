// Authentication middleware for PowerBackup API
import crypto from 'crypto';
import { log } from '../../utils/logger.js';
import { getOrGenerateHMACSecret } from '../../utils/config.js';

/**
 * HMAC request signing middleware
 * Validates requests using HMAC-SHA256 signatures
 */
export function authMiddleware(req, res, next) {
    try {
        // Skip auth for health check
        if (req.path === '/health') {
            return next();
        }

        // Get API key from headers
        const apiKey = req.headers['x-api-key'];
        const signature = req.headers['x-signature'];
        const timestamp = req.headers['x-timestamp'];

        if (!apiKey || !signature || !timestamp) {
            return res.status(401).json({
                error: 'Missing authentication headers',
                required: ['x-api-key', 'x-signature', 'x-timestamp']
            });
        }

        // Validate timestamp (prevent replay attacks)
        const requestTime = parseInt(timestamp);
        const currentTime = Date.now();
        const timeWindow = 5 * 60 * 1000; // 5 minutes

        if (Math.abs(currentTime - requestTime) > timeWindow) {
            return res.status(401).json({
                error: 'Request timestamp expired',
                message: 'Request must be made within 5 minutes of timestamp'
            });
        }

        // Get HMAC secret from config
        const hmacSecret = getOrGenerateHMACSecret(req.app.locals.config || {});
        
        if (!hmacSecret) {
            log.error('HMAC secret not configured');
            return res.status(500).json({
                error: 'Server configuration error'
            });
        }

        // Verify API key (in this implementation, API key is the HMAC secret)
        if (apiKey !== hmacSecret) {
            return res.status(401).json({
                error: 'Invalid API key'
            });
        }

        // Generate expected signature
        const method = req.method.toUpperCase();
        const path = req.path;
        const body = req.body ? JSON.stringify(req.body) : '';
        const message = `${method}${path}${body}${timestamp}`;
        
        const expectedSignature = crypto
            .createHmac('sha256', hmacSecret)
            .update(message)
            .digest('hex');

        // Compare signatures
        if (signature !== expectedSignature) {
            log.warn(`Invalid signature from ${req.ip}`);
            return res.status(401).json({
                error: 'Invalid signature'
            });
        }

        // Add authenticated user info to request
        req.user = {
            apiKey: apiKey,
            ip: req.ip,
            authenticated: true
        };

        next();
    } catch (error) {
        log.error('Authentication error:', error.message);
        return res.status(500).json({
            error: 'Authentication failed'
        });
    }
}

/**
 * Generate HMAC signature for client requests
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Object} body - Request body
 * @param {string} hmacSecret - HMAC secret
 * @returns {Object} Authentication headers
 */
export function generateAuthHeaders(method, path, body = null, hmacSecret) {
    const timestamp = Date.now().toString();
    const bodyString = body ? JSON.stringify(body) : '';
    const message = `${method.toUpperCase()}${path}${bodyString}${timestamp}`;
    
    const signature = crypto
        .createHmac('sha256', hmacSecret)
        .update(message)
        .digest('hex');

    return {
        'x-api-key': hmacSecret,
        'x-signature': signature,
        'x-timestamp': timestamp
    };
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid
 */
export function validateAPIKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        return false;
    }
    
    // API key should be a 64-character hex string
    return /^[a-f0-9]{64}$/.test(apiKey);
}

/**
 * Generate a new API key
 * @returns {string} New API key
 */
export function generateAPIKey() {
    return crypto.randomBytes(32).toString('hex');
}


