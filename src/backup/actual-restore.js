import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { log } from '../utils/logger.js';

export async function actualRestore(dbConfig, backupFile, targetDatabase = null) {
    try {
        const url = dbConfig.url_env ? process.env[dbConfig.url_env] : dbConfig.url;
        if (!url) {
            throw new Error(`No URL available for database ${dbConfig.name}`);
        }
        
        const restoreDbName = targetDatabase || dbConfig.name;
        log(`Starting actual restore to database: ${restoreDbName}`);
        
        if (dbConfig.type === 'mysql') {
            await actualRestoreMysql(url, backupFile, restoreDbName, dbConfig);
        } else {
            throw new Error(`Unsupported database type: ${dbConfig.type}`);
        }
        
        log(`Actual restore completed successfully to: ${restoreDbName}`);
    } catch (error) {
        log('Actual restore failed:', error.message);
        throw error;
    }
}

async function actualRestoreMysql(url, backupFile, targetDbName, dbConfig) {
    try {
        log('Reading and decompressing backup file...');
        const compressedData = await fs.readFile(backupFile);
        const { gunzipSync } = await import('zlib');
        const backupContent = gunzipSync(compressedData).toString('utf8');
        
        const parsed = new URL(url);
        const connection = await mysql.createConnection({
            host: parsed.hostname,
            user: parsed.username,
            password: parsed.password,
            port: parsed.port || 3306
        });
        
        try {
            // Drop and recreate database
            await connection.query(`DROP DATABASE IF EXISTS \`${targetDbName}\``);
            await connection.query(`CREATE DATABASE \`${targetDbName}\``);
            log(`Created target database: ${targetDbName}`);
            
            // Connect to target database
            const restoreConn = await mysql.createConnection({
                host: parsed.hostname,
                user: parsed.username,
                password: parsed.password,
                database: targetDbName,
                port: parsed.port || 3306,
                multipleStatements: true
            });
            
            try {
                log('Executing SQL dump...');
                await restoreConn.query(backupContent);
                log('SQL dump executed successfully');
                
                // Verify restore
                const [tables] = await restoreConn.query(`SHOW TABLES`);
                log(`Restore completed. Found ${tables.length} tables in ${targetDbName}`);
                
            } finally {
                await restoreConn.end();
            }
        } finally {
            await connection.end();
        }
    } catch (error) {
        log('MySQL actual restore failed:', error.message);
        throw error;
    }
}
