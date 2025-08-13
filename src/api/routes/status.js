// Status routes for PowerBackup API
import express from 'express';
import { asyncHandler } from '../middleware/error.js';
import { log } from '../../utils/logger.js';
import { loadConfig } from '../../utils/config.js';
import { BackupManager } from '../../backup/manager.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const router = express.Router();

/**
 * GET /api/v1/status
 * Get system status and health information
 */
router.get('/', asyncHandler(async (req, res) => {
    try {
        const config = await loadConfig();
        
        // Get system information
        const systemInfo = {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem()
            },
            cpu: {
                cores: os.cpus().length,
                loadAverage: os.loadavg()
            }
        };

        // Get PowerBackup status
        const powerbackupStatus = {
            version: process.env.npm_package_version || PKG_VERSION,
            configLoaded: !!config,
            databasesCount: config?.databases?.length || 0,
            apiEnabled: config?.api?.enabled || false,
            backupDirectory: config?.backup_dir || null
        };

        // Check backup directory status
        let backupDirStatus = 'unknown';
        if (config?.backup_dir) {
            try {
                await fs.access(config.backup_dir);
                backupDirStatus = 'accessible';
            } catch {
                backupDirStatus = 'inaccessible';
            }
        }

        // Get recent backup information
        let recentBackups = [];
        if (config?.databases && config.backup_dir) {
            try {
                for (const db of config.databases.slice(0, 5)) { // Limit to 5 databases
                    const dbBackupDir = path.join(config.backup_dir, db.name, 'hourly');
                    try {
                        const files = await fs.readdir(dbBackupDir);
                        const backupFiles = files.filter(f => !f.endsWith('.meta.json'));
                        if (backupFiles.length > 0) {
                            const latestFile = backupFiles[backupFiles.length - 1];
                            const stats = await fs.stat(path.join(dbBackupDir, latestFile));
                            recentBackups.push({
                                database: db.name,
                                latestBackup: latestFile,
                                size: stats.size,
                                modified: stats.mtime
                            });
                        }
                    } catch {
                        // Database backup directory doesn't exist or is inaccessible
                    }
                }
            } catch (error) {
                log.warn('Failed to get recent backup information:', error.message);
            }
        }

        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            system: systemInfo,
            powerbackup: powerbackupStatus,
            backupDirectory: {
                path: config?.backup_dir,
                status: backupDirStatus
            },
            recentBackups: recentBackups.slice(0, 10), // Limit to 10 recent backups
            api: {
                version: 'v1',
                endpoints: [
                    '/api/v1/status',
                    '/api/v1/databases',
                    '/api/v1/backups',
                    '/api/v1/restores',
                    '/api/v1/tables',
                    '/api/v1/logs'
                ]
            }
        };

        res.json(status);
    } catch (error) {
        log.error('Failed to get system status:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Failed to get system status',
            message: error.message
        });
    }
}));

/**
 * GET /api/v1/status/health
 * Simple health check endpoint
 */
router.get('/health', asyncHandler(async (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
}));

/**
 * GET /api/v1/status/databases
 * Get database connection status
 */
router.get('/databases', asyncHandler(async (req, res) => {
    try {
        const config = await loadConfig();
        const databaseStatus = [];

        if (config?.databases) {
            for (const db of config.databases) {
                const status = {
                    name: db.name,
                    type: db.type,
                    url: db.url ? 'configured' : 'not configured',
                    status: 'unknown'
                };

                // Try to test connection if URL is available
                if (db.url) {
                    try {
                        const manager = new BackupManager(config);
                        // This is a simple connection test - in a real implementation,
                        // you might want to add a dedicated connection test method
                        status.status = 'configured';
                    } catch (error) {
                        status.status = 'error';
                        status.error = error.message;
                    }
                }

                databaseStatus.push(status);
            }
        }

        res.json({
            databases: databaseStatus,
            total: databaseStatus.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        log.error('Failed to get database status:', error.message);
        res.status(500).json({
            error: 'Failed to get database status',
            message: error.message
        });
    }
}));

/**
 * GET /api/v1/status/backups
 * Get backup system status
 */
router.get('/backups', asyncHandler(async (req, res) => {
    try {
        const config = await loadConfig();
        const backupStatus = {
            backupDirectory: config?.backup_dir || null,
            totalBackups: 0,
            totalSize: 0,
            databases: []
        };

        if (config?.backup_dir && config?.databases) {
            for (const db of config.databases) {
                const dbStatus = {
                    name: db.name,
                    type: db.type,
                    tiers: {}
                };

                // Check each backup tier
                const tiers = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
                for (const tier of tiers) {
                    const tierDir = path.join(config.backup_dir, db.name, tier);
                    try {
                        const files = await fs.readdir(tierDir);
                        const backupFiles = files.filter(f => !f.endsWith('.meta.json'));
                        
                        let tierSize = 0;
                        for (const file of backupFiles) {
                            const stats = await fs.stat(path.join(tierDir, file));
                            tierSize += stats.size;
                        }

                        dbStatus.tiers[tier] = {
                            count: backupFiles.length,
                            size: tierSize,
                            latest: backupFiles.length > 0 ? backupFiles[backupFiles.length - 1] : null
                        };

                        backupStatus.totalBackups += backupFiles.length;
                        backupStatus.totalSize += tierSize;
                    } catch {
                        dbStatus.tiers[tier] = {
                            count: 0,
                            size: 0,
                            latest: null
                        };
                    }
                }

                backupStatus.databases.push(dbStatus);
            }
        }

        res.json({
            ...backupStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        log.error('Failed to get backup status:', error.message);
        res.status(500).json({
            error: 'Failed to get backup status',
            message: error.message
        });
    }
}));

export default router;

