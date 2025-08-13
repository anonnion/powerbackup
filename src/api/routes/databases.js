// Database routes for PowerBackup API
import express from 'express';
import { asyncHandler, ValidationError } from '../middleware/error.js';
import { validateDatabaseName, validateDatabaseType, validateDatabaseURL } from '../middleware/validation.js';
import { log } from '../../utils/logger.js';
import { loadConfig, saveConfig } from '../../utils/config.js';

const router = express.Router();

/**
 * GET /api/v1/databases
 * List all configured databases
 */
router.get('/', asyncHandler(async (req, res) => {
    try {
        const config = await loadConfig();
        const databases = config.databases || [];
        
        res.json({
            databases: databases.map(db => ({
                name: db.name,
                type: db.type,
                url: db.url ? 'configured' : 'not configured',
                url_env: db.url_env || null,
                keep: db.keep || config.default_keep,
                test_restore: db.test_restore || { enabled: false }
            })),
            total: databases.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        log.error('Failed to list databases:', error.message);
        res.status(500).json({
            error: 'Failed to list databases',
            message: error.message
        });
    }
}));

/**
 * GET /api/v1/databases/:name
 * Get specific database configuration
 */
router.get('/:name', asyncHandler(async (req, res) => {
    try {
        const { name } = req.params;
        const config = await loadConfig();
        
        const database = config.databases?.find(db => db.name === name);
        if (!database) {
            return res.status(404).json({
                error: 'Database not found',
                message: `Database '${name}' not found`
            });
        }
        
        res.json({
            database: {
                name: database.name,
                type: database.type,
                url: database.url || null,
                url_env: database.url_env || null,
                keep: database.keep || config.default_keep,
                test_restore: database.test_restore || { enabled: false }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        log.error('Failed to get database:', error.message);
        res.status(500).json({
            error: 'Failed to get database',
            message: error.message
        });
    }
}));

/**
 * POST /api/v1/databases
 * Add a new database
 */
router.post('/', asyncHandler(async (req, res) => {
    try {
        const { name, type, url, url_env, keep, test_restore } = req.body;
        
        // Validate required fields
        if (!name || !type) {
            throw new ValidationError('Name and type are required');
        }
        
        // Validate field types
        if (typeof name !== 'string' || typeof type !== 'string') {
            throw new ValidationError('Name and type must be strings');
        }
        
        // Validate database name
        if (!validateDatabaseName(name)) {
            throw new ValidationError('Invalid database name format');
        }
        
        // Validate database type
        if (!validateDatabaseType(type)) {
            throw new ValidationError('Invalid database type. Must be mysql or postgres');
        }
        
        // Validate URL if provided
        if (url && !validateDatabaseURL(url)) {
            throw new ValidationError('Invalid database URL format');
        }
        
        const config = await loadConfig();
        
        // Check if database already exists
        if (config.databases?.find(db => db.name === name)) {
            return res.status(409).json({
                error: 'Database already exists',
                message: `Database '${name}' already exists`
            });
        }
        
        // Create database configuration
        const database = {
            name,
            type,
            keep: keep || config.default_keep,
            test_restore: test_restore || { enabled: false }
        };
        
        if (url) database.url = url;
        if (url_env) database.url_env = url_env;
        
        // Add to config
        config.databases = config.databases || [];
        config.databases.push(database);
        
        await saveConfig(config);
        
        log.info(`Database '${name}' added successfully`);
        
        res.status(201).json({
            message: 'Database added successfully',
            database: {
                name: database.name,
                type: database.type,
                url: database.url ? 'configured' : 'not configured',
                url_env: database.url_env || null
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({
                error: 'Validation error',
                message: error.message
            });
        } else {
            log.error('Failed to add database:', error.message);
            res.status(500).json({
                error: 'Failed to add database',
                message: error.message
            });
        }
    }
}));

/**
 * PUT /api/v1/databases/:name
 * Update database configuration
 */
router.put('/:name', asyncHandler(async (req, res) => {
    try {
        const { name } = req.params;
        const { type, url, url_env, keep, test_restore } = req.body;
        
        // Validate database name
        if (!validateDatabaseName(name)) {
            throw new ValidationError('Invalid database name format');
        }
        
        const config = await loadConfig();
        
        // Find database
        const databaseIndex = config.databases?.findIndex(db => db.name === name);
        if (databaseIndex === -1) {
            return res.status(404).json({
                error: 'Database not found',
                message: `Database '${name}' not found`
            });
        }
        
        const database = config.databases[databaseIndex];
        
        // Update fields if provided
        if (type !== undefined) {
            if (!validateDatabaseType(type)) {
                throw new ValidationError('Invalid database type. Must be mysql or postgres');
            }
            database.type = type;
        }
        
        if (url !== undefined) {
            if (url && !validateDatabaseURL(url)) {
                throw new ValidationError('Invalid database URL format');
            }
            database.url = url;
        }
        
        if (url_env !== undefined) {
            database.url_env = url_env;
        }
        
        if (keep !== undefined) {
            database.keep = keep;
        }
        
        if (test_restore !== undefined) {
            database.test_restore = test_restore;
        }
        
        await saveConfig(config);
        
        log.info(`Database '${name}' updated successfully`);
        
        res.json({
            message: 'Database updated successfully',
            database: {
                name: database.name,
                type: database.type,
                url: database.url ? 'configured' : 'not configured',
                url_env: database.url_env || null,
                keep: database.keep,
                test_restore: database.test_restore
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            res.status(400).json({
                error: 'Validation error',
                message: error.message
            });
        } else {
            log.error('Failed to update database:', error.message);
            res.status(500).json({
                error: 'Failed to update database',
                message: error.message
            });
        }
    }
}));

/**
 * DELETE /api/v1/databases/:name
 * Remove database configuration
 */
router.delete('/:name', asyncHandler(async (req, res) => {
    try {
        const { name } = req.params;
        
        const config = await loadConfig();
        
        // Find database
        const databaseIndex = config.databases?.findIndex(db => db.name === name);
        if (databaseIndex === -1) {
            return res.status(404).json({
                error: 'Database not found',
                message: `Database '${name}' not found`
            });
        }
        
        // Remove database
        const removedDatabase = config.databases.splice(databaseIndex, 1)[0];
        await saveConfig(config);
        
        log.info(`Database '${name}' removed successfully`);
        
        res.json({
            message: 'Database removed successfully',
            database: {
                name: removedDatabase.name,
                type: removedDatabase.type
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        log.error('Failed to remove database:', error.message);
        res.status(500).json({
            error: 'Failed to remove database',
            message: error.message
        });
    }
}));

export default router;

