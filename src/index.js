#!/usr/bin/env node

// 🚀 PowerBackup v2.0.0 - Main Entry Point
// Multi-Database Backup & Restore Tool with Beautiful Logging

import { BackupManager } from './backup/manager.js';
import { PowerBackupScheduler } from './scheduler.js';
import { log } from './utils/logger.js';

// Export main classes for programmatic use
export { BackupManager } from './backup/manager.js';
export { PowerBackupScheduler } from './scheduler.js';
export { log } from './utils/logger.js';

// Export utility functions
export { decryptBackupFile, decompressBackupFile } from './utils/file.js';

// Export backup functions
export { createMySQLDump } from './backup/dump/mysql.js';
export { createPostgresDump } from './backup/dump/postgres.js';
export { restoreBackup } from './backup/restore.js';
export { actualRestore } from './backup/actual-restore.js';
export { listBackupTables, restoreTable, interactiveTableRestore } from './backup/table-restore.js';
export { compressFile } from './backup/compress.js';
export { encryptFile } from './backup/encrypt.js';

// Version information
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export const PKG_VERSION = require('../package.json').version;
export const VERSION = PKG_VERSION;
export const DESCRIPTION = 'Multi-Database Backup & Restore Tool with Beautiful Logging & Restore Locations';

// Main function for programmatic use
export async function main() {
    try {
        log.info(`🚀 PowerBackup v${VERSION} - ${DESCRIPTION}`);
        
        // Import CLI dynamically to avoid circular dependencies
        const { default: cli } = await import('./cli.js');
        return cli;
    } catch (error) {
        log.error('💥 Failed to start PowerBackup:', error.message);
        process.exit(1);
    }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
