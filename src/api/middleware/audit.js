// Audit logging middleware for PowerBackup API
import { log } from '../../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Audit logging middleware
 * Logs all API operations for security and compliance
 */
export function auditMiddleware(req, res, next) {
    const startTime = Date.now();
    const originalSend = res.send;

    // Override res.send to capture response
    res.send = function(data) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Create audit log entry
        const auditEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            duration: duration,
            user: req.user || null,
            requestId: req.headers['x-request-id'] || generateRequestId(),
            body: req.method !== 'GET' ? sanitizeBody(req.body) : null,
            responseSize: data ? data.length : 0
        };

        // Log audit entry
        logAuditEntry(auditEntry);
        
        // Call original send
        return originalSend.call(this, data);
    };

    next();
}

/**
 * Log audit entry to file and console
 * @param {Object} entry - Audit log entry
 */
async function logAuditEntry(entry) {
    try {
        // Console logging for immediate visibility
        const logLevel = entry.statusCode >= 400 ? 'error' : 'info';
        log[logLevel](`AUDIT: ${entry.method} ${entry.path} - ${entry.statusCode} (${entry.duration}ms) - ${entry.ip}`);

        // File logging for persistence
        await writeAuditLog(entry);
    } catch (error) {
        log.error('Failed to write audit log:', error.message);
    }
}

/**
 * Write audit log to file
 * @param {Object} entry - Audit log entry
 */
async function writeAuditLog(entry) {
    try {
        const auditDir = path.resolve(process.cwd(), './logs/audit');
        await fs.mkdir(auditDir, { recursive: true });

        const date = new Date().toISOString().split('T')[0];
        const auditFile = path.join(auditDir, `audit-${date}.log`);

        const logLine = JSON.stringify(entry) + '\n';
        await fs.appendFile(auditFile, logLine);
    } catch (error) {
        log.error('Failed to write audit log file:', error.message);
    }
}

/**
 * Sanitize request body for logging
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
function sanitizeBody(body) {
    if (!body) return null;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'passphrase', 'secret', 'token', 'key'];

    // Remove sensitive fields
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    // Truncate large fields
    Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
            sanitized[key] = sanitized[key].substring(0, 100) + '...';
        }
    });

    return sanitized;
}

/**
 * Generate unique request ID
 * @returns {string} Request ID
 */
function generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get audit logs for a specific date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Audit log entries
 */
export async function getAuditLogs(startDate, endDate) {
    try {
        const auditDir = path.resolve(process.cwd(), './logs/audit');
        const logs = [];

        // Get all audit files in date range
        const files = await fs.readdir(auditDir);
        const auditFiles = files.filter(file => {
            if (!file.startsWith('audit-') || !file.endsWith('.log')) return false;
            const fileDate = file.replace('audit-', '').replace('.log', '');
            return fileDate >= startDate && fileDate <= endDate;
        });

        // Read and parse log files
        for (const file of auditFiles) {
            const filePath = path.join(auditDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            
            content.split('\n').forEach(line => {
                if (line.trim()) {
                    try {
                        logs.push(JSON.parse(line));
                    } catch (error) {
                        log.warn('Failed to parse audit log line:', error.message);
                    }
                }
            });
        }

        return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
        log.error('Failed to get audit logs:', error.message);
        return [];
    }
}

/**
 * Clean up old audit logs
 * @param {number} daysToKeep - Number of days to keep logs
 */
export async function cleanupAuditLogs(daysToKeep = 90) {
    try {
        const auditDir = path.resolve(process.cwd(), './logs/audit');
        const files = await fs.readdir(auditDir);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        for (const file of files) {
            if (!file.startsWith('audit-') || !file.endsWith('.log')) continue;
            
            const fileDate = file.replace('audit-', '').replace('.log', '');
            const logDate = new Date(fileDate);
            
            if (logDate < cutoffDate) {
                const filePath = path.join(auditDir, file);
                await fs.unlink(filePath);
                log.info(`Deleted old audit log: ${file}`);
            }
        }
    } catch (error) {
        log.error('Failed to cleanup audit logs:', error.message);
    }
}


