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
