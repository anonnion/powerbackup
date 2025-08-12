#!/usr/bin/env node

import { BackupManager } from './backup/manager.js';
import { log } from './utils/logger.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

class PowerBackupScheduler {
    constructor(config) {
        this.config = config;
        this.manager = new BackupManager(config);
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) {
            log.warn('🔄 Scheduler is already running');
            return;
        }

        this.isRunning = true;
        log.success('🚀 PowerBackup Scheduler started');

        // Run initial backup and pruning
        await this.runScheduledTasks();

        // Schedule hourly execution
        setInterval(async () => {
            await this.runScheduledTasks();
        }, 60 * 60 * 1000); // 1 hour in milliseconds

        log.info('⏰ Scheduled hourly backups and pruning');
    }

    async stop() {
        this.isRunning = false;
        log.info('🛑 PowerBackup Scheduler stopped');
    }

    async runScheduledTasks() {
        const now = new Date();
        log.info(`🕐 Running scheduled tasks at ${now.toLocaleString()}`);

        try {
            // Process each database
            for (const db of this.config.databases || []) {
                try {
                    await this.processDatabase(db);
                } catch (error) {
                    log.error(`❌ Error processing database ${chalk.cyan(db.name)}:`, error.message);
                }
            }

            log.success('✅ Scheduled tasks completed successfully');
        } catch (error) {
            log.error('💥 Scheduled tasks failed:', error.message);
        }
    }

    async processDatabase(db) {
        log.info(`📊 Processing database: ${chalk.cyan(db.name)}`);

        // 1. Create backup
        try {
            const backupPath = await this.manager.performBackup(db);
            log.success(`💾 Backup created for ${chalk.cyan(db.name)}: ${chalk.gray(backupPath)}`);
        } catch (error) {
            log.error(`💥 Backup failed for ${chalk.cyan(db.name)}:`, error.message);
            return;
        }

        // 2. Run test restore if configured
        if (db.test_restore?.enabled) {
            const currentHour = new Date().getHours();
            if (currentHour === (db.test_restore.hour || 3)) {
                try {
                    log.info(`🧪 Running scheduled test restore for ${chalk.cyan(db.name)}`);
                    await this.manager.testRestore(db, backupPath);
                    log.success(`✅ Test restore completed for ${chalk.cyan(db.name)}`);
                } catch (error) {
                    log.error(`❌ Test restore failed for ${chalk.cyan(db.name)}:`, error.message);
                }
            }
        }

        // 3. Prune old backups according to retention rules
        await this.pruneBackups(db);
    }

    async pruneBackups(db) {
        try {
            log.info(`🧹 Pruning backups for ${chalk.cyan(db.name)}`);

            const retention = db.keep || this.config.default_keep;
            const backupDir = path.join(this.config.backup_dir, db.name);

            // Prune each tier
            const tiers = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
            
            for (const tier of tiers) {
                const tierDir = path.join(backupDir, tier);
                const maxKeep = retention[tier] || 0;

                if (maxKeep <= 0) {
                    log.info(`🗑️ Skipping ${tier} tier (keep: ${maxKeep})`);
                    continue;
                }

                await this.pruneTier(tierDir, maxKeep, tier);
            }

            log.success(`✅ Pruning completed for ${chalk.cyan(db.name)}`);
        } catch (error) {
            log.error(`❌ Pruning failed for ${chalk.cyan(db.name)}:`, error.message);
        }
    }

    async pruneTier(tierDir, maxKeep, tierName) {
        try {
            // Check if directory exists
            try {
                await fs.access(tierDir);
            } catch {
                log.info(`📁 Tier directory doesn't exist: ${chalk.gray(tierDir)}`);
                return;
            }

            // Get all backup files (excluding metadata files)
            const files = await fs.readdir(tierDir);
            const backupFiles = files.filter(f => !f.endsWith('.meta.json'));

            if (backupFiles.length <= maxKeep) {
                log.info(`📊 ${tierName} tier: ${backupFiles.length}/${maxKeep} files (no pruning needed)`);
                return;
            }

            // Get file stats and sort by modification time (oldest first)
            const fileStats = await Promise.all(
                backupFiles.map(async (file) => {
                    const filePath = path.join(tierDir, file);
                    const stats = await fs.stat(filePath);
                    return { file, path: filePath, mtime: stats.mtime };
                })
            );

            fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

            // Remove oldest files beyond retention limit
            const filesToRemove = fileStats.slice(0, fileStats.length - maxKeep);
            
            if (filesToRemove.length === 0) {
                log.info(`📊 ${tierName} tier: ${backupFiles.length}/${maxKeep} files (no pruning needed)`);
                return;
            }

            log.info(`🗑️ Pruning ${tierName} tier: removing ${filesToRemove.length} old files`);

            for (const fileInfo of filesToRemove) {
                try {
                    await fs.unlink(fileInfo.path);
                    
                    // Also remove metadata file if it exists
                    const metaPath = fileInfo.path + '.meta.json';
                    try {
                        await fs.unlink(metaPath);
                    } catch {
                        // Metadata file doesn't exist, ignore
                    }

                    log.info(`🗑️ Removed: ${chalk.gray(fileInfo.file)}`);
                } catch (error) {
                    log.error(`❌ Failed to remove ${fileInfo.file}:`, error.message);
                }
            }

            log.success(`✅ ${tierName} tier pruning completed: ${filesToRemove.length} files removed`);
        } catch (error) {
            log.error(`❌ Failed to prune ${tierName} tier:`, error.message);
        }
    }

    async runOnce() {
        log.info('🔄 Running one-time scheduled tasks');
        await this.runScheduledTasks();
        process.exit(0);
    }
}

// CLI interface
async function main() {
    try {
        const configPath = process.argv[2] || './src/config/config.json';
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);

        const scheduler = new PowerBackupScheduler(config);

        // Handle different modes
        const mode = process.argv[3] || 'daemon';

        switch (mode) {
            case 'once':
                await scheduler.runOnce();
                break;
            case 'daemon':
                await scheduler.start();
                // Keep the process running
                process.on('SIGINT', async () => {
                    log.info('🛑 Received SIGINT, shutting down gracefully...');
                    await scheduler.stop();
                    process.exit(0);
                });
                process.on('SIGTERM', async () => {
                    log.info('🛑 Received SIGTERM, shutting down gracefully...');
                    await scheduler.stop();
                    process.exit(0);
                });
                break;
            default:
                log.error('❌ Invalid mode. Use "once" or "daemon"');
                process.exit(1);
        }
    } catch (error) {
        log.error('💥 Scheduler failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { PowerBackupScheduler };
