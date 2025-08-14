import { spawn } from 'child_process';
import { log } from '../../utils/logger.js';
import { findBinary } from '../../utils/find-binary.js';
import path from 'path';
import { URL } from 'url';

/**
 * Run mysqldump using the provided MySQL URL and output file path.
 * @param {string} url - MySQL connection string
 * @param {string} outputPath - Path to write the dump file
 * @param {boolean} schemaOnly - If true, dump schema only
 * @returns {Promise<void>}
 */
export async function runMySqlDump(url, outputPath, schemaOnly = false) {
    return new Promise(async (resolve, reject) => {
        try {
            const parsed = new URL(url);
            const args = [];
            if (parsed.hostname) args.push('-h', parsed.hostname);
            if (parsed.port) args.push('-P', parsed.port);
            if (parsed.username) args.push('-u', parsed.username);
            if (parsed.password) args.push(`-p${parsed.password}`);
            if (schemaOnly) args.push('--no-data');
            args.push(parsed.pathname.replace(/^\//, ''));

            // Try to get binary path from config or auto-detect
            let binaryPath = process.env.MYSQLDUMP_PATH || null;
            
            // Check if we have a configured mysqlPath directory
            if (!binaryPath && global.powerbackupConfig && global.powerbackupConfig.binaries && global.powerbackupConfig.binaries.mysqlPath) {
                const mysqlDir = global.powerbackupConfig.binaries.mysqlPath;
                const isWin = process.platform === 'win32';
                const mysqldumpName = isWin ? 'mysqldump.exe' : 'mysqldump';
                binaryPath = path.join(mysqlDir, mysqldumpName);
                log.info(`[mysqldump] Using configured mysqlPath: ${binaryPath}`);
            }
            
            // If still no binary path, try to find it in PATH
            if (!binaryPath) {
                binaryPath = await findBinary('mysqldump');
                if (binaryPath) log.info(`[mysqldump] Auto-detected binary: ${binaryPath}`);
            }
            
            // Last resort: use just the command name
            if (!binaryPath) binaryPath = 'mysqldump';

            log.info(`[mysqldump] Running: ${binaryPath} ${args.join(' ')} > ${outputPath}`);
            const child = spawn(binaryPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
            const fs = await import('fs');
            const outStream = fs.createWriteStream(outputPath);
            child.stdout.pipe(outStream);

            child.stderr.on('data', (data) => {
                // mysqldump writes progress info to stderr, so log as info instead of error
                log.info(`[mysqldump] ${data}`);
            });
            child.on('close', (code) => {
                if (code === 0) {
                    log.success('[mysqldump] Dump completed successfully');
                    resolve();
                } else {
                    reject(new Error(`[mysqldump] exited with code ${code}`));
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}
