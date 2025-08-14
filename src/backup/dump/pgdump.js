import { spawn } from 'child_process';
import { log } from '../../utils/logger.js';
import { findBinary } from '../../utils/find-binary.js';
import path from 'path';
import { URL } from 'url';

/**
 * Run pg_dump using the provided Postgres URL and output file path.
 * @param {string} url - Postgres connection string
 * @param {string} outputPath - Path to write the dump file
 * @returns {Promise<void>}
 */
export async function runPgDump(url, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const parsed = new URL(url);
            const args = [];
            if (parsed.hostname) args.push('-h', parsed.hostname);
            if (parsed.port) args.push('-p', parsed.port);
            if (parsed.username) args.push('-U', parsed.username);
            if (parsed.pathname) args.push('-d', parsed.pathname.replace(/^\//, ''));
            // Use SQL format instead of binary format for compatibility
            args.push('-F', 'p'); // 'p' for plain SQL format
            args.push('-f', outputPath);
            args.push('-v'); // Add verbose output for debugging
            
            // Set password env if present
            const env = { ...process.env };
            if (parsed.password) env.PGPASSWORD = parsed.password;

            // Try to get binary path from config or auto-detect
            let binaryPath = process.env.PG_DUMP_PATH || null;
            
            // Check if we have a configured postgresPath directory
            if (!binaryPath && global.powerbackupConfig && global.powerbackupConfig.binaries && global.powerbackupConfig.binaries.postgresPath) {
                const postgresDir = global.powerbackupConfig.binaries.postgresPath;
                const isWin = process.platform === 'win32';
                const pgDumpName = isWin ? 'pg_dump.exe' : 'pg_dump';
                binaryPath = path.join(postgresDir, pgDumpName);
                log.info(`[pg_dump] Using configured postgresPath: ${binaryPath}`);
            }
            
            // If still no binary path, try to find it in PATH
            if (!binaryPath) {
                binaryPath = await findBinary('pg_dump');
                if (binaryPath) log.info(`[pg_dump] Auto-detected binary: ${binaryPath}`);
            }
            
            // Last resort: use just the command name
            if (!binaryPath) binaryPath = 'pg_dump';

            log.info(`[pg_dump] Running: ${binaryPath} ${args.join(' ')}`);
            
            // Test if binary exists and is executable
            try {
                const { execSync } = await import('child_process');
                execSync(`"${binaryPath}" --version`, { stdio: 'pipe' });
                log.info(`[pg_dump] Binary test successful: ${binaryPath}`);
            } catch (versionError) {
                log.error(`[pg_dump] Binary not found or not executable: ${binaryPath}`);
                log.error(`[pg_dump] Version test error: ${versionError.message}`);
                throw new Error(`pg_dump binary not found or not executable: ${binaryPath}`);
            }

            const child = spawn(binaryPath, args, { env });
            let stdout = '';
            let stderr = '';
            
            child.stdout.on('data', (data) => {
                stdout += data.toString();
                log.info(`[pg_dump] ${data.toString().trim()}`);
            });
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
                // pg_dump writes progress info to stderr, so log as info instead of error
                log.info(`[pg_dump] ${data.toString().trim()}`);
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    log.success('[pg_dump] Dump completed successfully');
                    resolve();
                } else {
                    log.error(`[pg_dump] Process exited with code ${code}`);
                    log.error(`[pg_dump] stdout: ${stdout}`);
                    log.error(`[pg_dump] stderr: ${stderr}`);
                    reject(new Error(`[pg_dump] exited with code ${code}. stderr: ${stderr}`));
                }
            });
            
            child.on('error', (error) => {
                log.error(`[pg_dump] Spawn error: ${error.message}`);
                reject(new Error(`[pg_dump] spawn error: ${error.message}`));
            });
            
        } catch (err) {
            reject(err);
        }
    });
}
