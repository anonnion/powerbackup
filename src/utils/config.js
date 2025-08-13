// Config loader and validator for PowerBackup
import fs from 'fs/promises';
import path from 'path';
import { log } from './logger.js';

/**
 * Load configuration from file
 * @param {string} configPath - Path to config file
 * @returns {Object} Configuration object
 */
export async function loadConfig(configPath = null) {
    try {
        const defaultPath = path.resolve(process.cwd(), './src/config/config.json');
        const filePath = configPath || defaultPath;
        
        const content = await fs.readFile(filePath, 'utf8');
        const config = JSON.parse(content);
        
        // Validate and set defaults
        return validateAndSetDefaults(config);
    } catch (error) {
        throw new Error(`Failed to load config: ${error.message}`);
    }
}

/**
 * Save configuration to file
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to config file
 */
export async function saveConfig(config, configPath = null) {
    try {
        const defaultPath = path.resolve(process.cwd(), './src/config/config.json');
        const filePath = configPath || defaultPath;
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Validate before saving
        const validatedConfig = validateAndSetDefaults(config);
        
        await fs.writeFile(filePath, JSON.stringify(validatedConfig, null, 2));
        log.success(`Configuration saved to: ${filePath}`);
    } catch (error) {
        throw new Error(`Failed to save config: ${error.message}`);
    }
}

/**
 * Validate configuration and set defaults
 * @param {Object} config - Configuration object
 * @returns {Object} Validated configuration
 */
function validateAndSetDefaults(config) {
    const validated = { ...config };

    // Set default backup directory
    if (!validated.backup_dir) {
        validated.backup_dir = '../../backups';
    }

    // Set default GPG configuration
    if (!validated.gpg) {
        validated.gpg = {
            symmetric_passphrase_file: './src/config/passphrase',
            recipients: []
        };
    }

    // Set default restore locations
    if (!validated.restore_locations) {
        validated.restore_locations = {};
    }

    // Set default databases array
    if (!validated.databases) {
        validated.databases = [];
    }

    // Set default keyring path
    if (!validated.keyring_path) {
        validated.keyring_path = './src/config/keyring.gpg';
    }

    // Set default keep policy
    if (!validated.default_keep) {
        validated.default_keep = {
            hourly: 24,
            daily: 7,
            weekly: 4,
            monthly: 12,
            yearly: 0
        };
    }

    // Set API configuration defaults
    if (!validated.api) {
        validated.api = {
            enabled: false,
            port: 3000,
            host: 'localhost',
            cors: {
                origins: ['http://localhost:3000']
            },
            rateLimit: {
                max: 100,
                windowMs: 15 * 60 * 1000
            },
            auth: {
                hmacSecret: null,
                jwtSecret: null,
                tokenExpiry: '24h'
            }
        };
    }

    // Validate database configurations
    if (validated.databases && Array.isArray(validated.databases)) {
        validated.databases.forEach((db, index) => {
            if (!db.name) {
                throw new Error(`Database at index ${index} missing required field: name`);
            }
            if (!db.type || !['mysql', 'postgres'].includes(db.type)) {
                throw new Error(`Database ${db.name} has invalid type. Must be 'mysql' or 'postgres'`);
            }
            if (!db.url && !db.url_env) {
                throw new Error(`Database ${db.name} missing connection URL or environment variable`);
            }

            // Set default keep policy for database if not specified
            if (!db.keep) {
                db.keep = { ...validated.default_keep };
            }

            // Set default test restore configuration
            if (!db.test_restore) {
                db.test_restore = {
                    enabled: true,
                    verify_query: 'SELECT COUNT(*) FROM information_schema.tables',
                    hour: 3
                };
            }
        });
    }

    return validated;
}

/**
 * Get API configuration
 * @param {Object} config - Full configuration object
 * @returns {Object} API configuration
 */
export function getAPIConfig(config) {
    return config.api || {
        enabled: false,
        port: 3000,
        host: 'localhost'
    };
}

/**
 * Check if API is enabled
 * @param {Object} config - Configuration object
 * @returns {boolean} True if API is enabled
 */
export function isAPIEnabled(config) {
    return config.api?.enabled === true;
}

/**
 * Generate HMAC secret if not exists
 * @param {Object} config - Configuration object
 * @returns {string} HMAC secret
 */
export function getOrGenerateHMACSecret(config) {
    if (!config.api?.auth?.hmacSecret) {
        // Generate a secure random secret
        const crypto = require('crypto');
        const secret = crypto.randomBytes(32).toString('hex');
        
        if (!config.api) config.api = {};
        if (!config.api.auth) config.api.auth = {};
        config.api.auth.hmacSecret = secret;
        
        log.warn('Generated new HMAC secret. Please save your configuration.');
    }
    
    return config.api.auth.hmacSecret;
}

/**
 * Get JWT secret
 * @param {Object} config - Configuration object
 * @returns {string} JWT secret
 */
export function getJWTSecret(config) {
    if (!config.api?.auth?.jwtSecret) {
        throw new Error('JWT secret not configured. Please set api.auth.jwtSecret in your configuration.');
    }
    
    return config.api.auth.jwtSecret;
}

/**
 * Validate API configuration
 * @param {Object} config - Configuration object
 * @returns {boolean} True if valid
 */
export function validateAPIConfig(config) {
    if (!config.api) {
        throw new Error('API configuration not found');
    }

    if (!config.api.enabled) {
        throw new Error('API is not enabled. Set api.enabled to true');
    }

    if (!config.api.auth?.hmacSecret) {
        throw new Error('HMAC secret not configured. Set api.auth.hmacSecret');
    }

    if (!config.api.auth?.jwtSecret) {
        throw new Error('JWT secret not configured. Set api.auth.jwtSecret');
    }

    return true;
}
