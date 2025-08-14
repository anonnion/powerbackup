import { promisify } from 'util';
import { exec } from 'child_process';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Try to find the full path to a binary using 'which' (Linux/macOS) or 'where' (Windows).
 * @param {string} binaryName
 * @returns {Promise<string|null>} Full path or null if not found
 */
export async function findBinary(binaryName) {
    const isWin = os.platform().startsWith('win');
    const cmd = isWin ? `where ${binaryName}` : `which ${binaryName}`;
    try {
        const { stdout } = await execAsync(cmd);
        const path = stdout.split(/\r?\n/)[0].trim();
        return path || null;
    } catch {
        return null;
    }
}

/**
 * Try to detect MySQL binary paths by checking common installation locations
 * @returns {Promise<string|null>} Directory containing MySQL binaries or null if not found
 */
export async function detectMySQLPath() {
    const isWin = os.platform().startsWith('win');
    const commonPaths = isWin ? [
        'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin',
        'C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin',
        'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin',
        'C:\\Program Files (x86)\\MySQL\\MySQL Server 5.7\\bin'
    ] : [
        '/usr/bin',
        '/usr/local/bin',
        '/usr/local/mysql/bin'
    ];

    // First try to find mysql executable
    const mysqlPath = await findBinary('mysql');
    if (mysqlPath) {
        return mysqlPath.replace(/[\/\\]mysql(?:\.exe)?$/, '');
    }

    // Then check common paths
    for (const path of commonPaths) {
        try {
            const mysqlExists = await execAsync(
                isWin 
                    ? `if exist "${path}\\mysql.exe" (exit 0) else (exit 1)`
                    : `test -f "${path}/mysql"`
            );
            return path;
        } catch {}
    }
    return null;
}

/**
 * Try to detect PostgreSQL binary paths by checking common installation locations
 * @returns {Promise<string|null>} Directory containing PostgreSQL binaries or null if not found
 */
export async function detectPostgreSQLPath() {
    const isWin = os.platform().startsWith('win');
    const commonPaths = isWin ? [
        'C:\\Program Files\\PostgreSQL\\17\\bin',
        'C:\\Program Files\\PostgreSQL\\16\\bin',
        'C:\\Program Files\\PostgreSQL\\15\\bin',
        'C:\\Program Files\\PostgreSQL\\14\\bin',
        'C:\\Program Files\\PostgreSQL\\13\\bin',
        'C:\\Program Files (x86)\\PostgreSQL\\17\\bin',
        'C:\\Program Files (x86)\\PostgreSQL\\16\\bin',
        'C:\\Program Files (x86)\\PostgreSQL\\15\\bin'
    ] : [
        '/usr/bin',
        '/usr/local/bin',
        '/usr/lib/postgresql/17/bin',
        '/usr/lib/postgresql/16/bin',
        '/usr/lib/postgresql/15/bin',
        '/usr/lib/postgresql/14/bin',
        '/usr/lib/postgresql/13/bin',
        '/opt/postgresql/bin'
    ];

    // First try to find psql executable
    const psqlPath = await findBinary('psql');
    if (psqlPath) {
        return psqlPath.replace(/[\/\\]psql(?:\.exe)?$/, '');
    }

    // Then check common paths
    for (const path of commonPaths) {
        try {
            const psqlExists = await execAsync(
                isWin 
                    ? `if exist "${path}\\psql.exe" (exit 0) else (exit 1)`
                    : `test -f "${path}/psql"`
            );
            return path;
        } catch {}
    }
    return null;
}
