import { spawn } from 'child_process';
import { log } from '../../utils/logger.js';
import { findBinary } from '../../utils/find-binary.js';

/**
 * Run pg_dump using the provided Postgres URL and output file path.
 * @param {string} url - Postgres connection string
 * @param {string} outputPath - Path to write the dump file
 * @returns {Promise<void>}
 */
export async function runPgDump(url, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            const { URL } = require('url');
            const parsed = new URL(url);
            const args = [];
            if (parsed.hostname) args.push('-h', parsed.hostname);
            if (parsed.port) args.push('-p', parsed.port);
            if (parsed.username) args.push('-U', parsed.username);
            if (parsed.pathname) args.push('-d', parsed.pathname.replace(/^\//, ''));
            args.push('-F', 'c');
            args.push('-f', outputPath);
            // Set password env if present
            const env = { ...process.env };
            if (parsed.password) env.PGPASSWORD = parsed.password;

            // Try to get binary path from config or auto-detect
            let binaryPath = process.env.PG_DUMP_PATH || null;
            if (!binaryPath && global.powerbackupConfig && global.powerbackupConfig.binaries && global.powerbackupConfig.binaries.pg_dump) {
                binaryPath = global.powerbackupConfig.binaries.pg_dump;
            }
            if (!binaryPath) {
                binaryPath = await findBinary('pg_dump');
                if (binaryPath) log.info(`[pg_dump] Auto-detected binary: ${binaryPath}`);
            }
            if (!binaryPath) binaryPath = 'pg_dump';

            log.info(`[pg_dump] Running: ${binaryPath} ${args.join(' ')}`);
            const child = spawn(binaryPath, args, { env });
            child.stdout.on('data', (data) => {
                log.info(`[pg_dump] ${data}`);
            });
            child.stderr.on('data', (data) => {
                log.error(`[pg_dump] ${data}`);
            });
            child.on('close', (code) => {
                if (code === 0) {
                    log.success('[pg_dump] Dump completed successfully');
                    resolve();
                } else {
                    reject(new Error(`[pg_dump] exited with code ${code}`));
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}
