import winston from 'winston';
import chalk from 'chalk';
import { format } from 'date-fns';

// Custom format for beautiful timestamps
const timestampFormat = () => {
    return format(new Date(), 'MMM dd, yyyy HH:mm:ss');
};

// Custom format for colored output
const customFormat = winston.format.printf(({ level, message, timestamp }) => {
    const time = chalk.gray(`[${timestampFormat()}]`);
    
    let levelColor;
    let emoji;
    
    switch (level) {
        case 'error':
            levelColor = chalk.red;
            emoji = '❌';
            break;
        case 'warn':
            levelColor = chalk.yellow;
            emoji = '⚠️';
            break;
        case 'info':
            levelColor = chalk.blue;
            emoji = 'ℹ️';
            break;
        case 'success':
            levelColor = chalk.green;
            emoji = '✅';
            break;
        case 'debug':
            levelColor = chalk.magenta;
            emoji = '🐛';
            break;
        default:
            levelColor = chalk.white;
            emoji = '📝';
    }
    
    return `${time} ${emoji} ${levelColor(level.toUpperCase())} ${message}`;
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'success',
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        success: 3,
        debug: 4
    },
    format: winston.format.combine(
        winston.format.timestamp(),
        customFormat
    ),
    transports: [
        new winston.transports.Console({
            level: process.env.LOG_LEVEL || 'success',
            format: winston.format.combine(
                winston.format.timestamp(),
                customFormat
            )
        })
    ]
});

// Helper functions for different log types
export const log = {
    info: (message, ...args) => {
        logger.info(message, ...args);
    },
    
    success: (message, ...args) => {
        logger.log('success', message, ...args);
    },
    
    warn: (message, ...args) => {
        logger.warn(message, ...args);
    },
    
    error: (message, ...args) => {
        logger.error(message, ...args);
    },
    
    debug: (message, ...args) => {
        logger.debug(message, ...args);
    },
    
    // Special logging functions for different operations
    backup: {
        start: (dbName) => log.info(`🚀 Starting backup for ${chalk.cyan(dbName)}...`),
        progress: (tableName, current, total) => log.info(`📊 Processing table ${chalk.yellow(tableName)} (${current}/${total})`),
        complete: (dbName, filePath) => log.success(`💾 Backup completed for ${chalk.cyan(dbName)}: ${chalk.gray(filePath)}`),
        error: (dbName, error) => log.error(`💥 Backup failed for ${chalk.cyan(dbName)}: ${error}`)
    },
    
    restore: {
        start: (dbName) => log.info(`🔄 Starting restore for ${chalk.cyan(dbName)}...`),
        progress: (statement, current, total) => log.info(`⚡ Executing statement ${current}/${total}`),
        complete: (dbName, tableCount) => log.success(`🎉 Restore completed for ${chalk.cyan(dbName)} with ${chalk.green(tableCount)} tables`),
        error: (dbName, error) => log.error(`💥 Restore failed for ${chalk.cyan(dbName)}: ${error}`)
    },
    
    encryption: {
        start: () => log.info(`🔐 Encrypting backup...`),
        complete: () => log.success(`🔒 Encryption completed`),
        error: (error) => log.error(`🔓 Encryption failed: ${error}`)
    },
    
    compression: {
        start: () => log.info(`🗜️ Compressing backup...`),
        complete: () => log.success(`📦 Compression completed`),
        error: (error) => log.error(`💥 Compression failed: ${error}`)
    },
    
    database: {
        connect: (type, host) => log.info(`🔌 Connecting to ${chalk.cyan(type)} database at ${chalk.gray(host)}`),
        connected: (type, host) => log.success(`✅ Connected to ${chalk.cyan(type)} database at ${chalk.gray(host)}`),
        error: (type, host, error) => log.error(`❌ Failed to connect to ${chalk.cyan(type)} database at ${chalk.gray(host)}: ${error}`)
    },
    
    table: {
        list: (tables) => log.info(`📋 Found ${chalk.green(tables.length)} tables: ${chalk.yellow(tables.join(', '))}`),
        restore: (tableName) => log.info(`🔄 Restoring table ${chalk.yellow(tableName)}...`),
        restored: (tableName) => log.success(`✅ Table ${chalk.yellow(tableName)} restored successfully`),
        error: (tableName, error) => log.error(`💥 Failed to restore table ${chalk.yellow(tableName)}: ${error}`)
    }
};

export default log;
