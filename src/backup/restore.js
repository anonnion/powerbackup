import mysql from 'mysql2/promise';
import pg from 'pg';
import fs from 'fs/promises';
import { log } from '../utils/logger.js';

export async function restoreBackup(dbConfig, backupFile) {
    try {
        const url = dbConfig.url_env ? process.env[dbConfig.url_env] : dbConfig.url;
        if (!url) {
            throw new Error(`No URL available for database ${dbConfig.name}`);
        }
        log('Starting restore process...');
        const tmpDbName = `restore_${Date.now()}`;
        if (dbConfig.type === 'mysql') {
            await testRestoreMysql(url, backupFile, tmpDbName, dbConfig);
        } else if (dbConfig.type === 'postgres') {
            await testRestorePostgres(url, backupFile, tmpDbName, dbConfig);
        } else {
            throw new Error(`Unsupported database type: ${dbConfig.type}`);
        }
    } catch (error) {
        log('RestoreBackup failed:', error.message);
        throw error;
    }
}

async function testRestoreMysql(url, backupFile, tmpDbName, dbConfig) {
    try {
        log('Reading backup file...');
        const fileStats = await fs.stat(backupFile);
        log(`Backup file size: ${fileStats.size} bytes`);
        
        const compressedData = await fs.readFile(backupFile);
        log(`Read ${compressedData.length} bytes from backup file`);
        
        log('Decompressing backup data...');
        const { gunzipSync } = await import('zlib');
        
        let backupContent;
        try {
            backupContent = gunzipSync(compressedData);
            log('Successfully decompressed backup data');
        } catch (err) {
            log('Failed to decompress backup:', err.message);
            throw new Error('Failed to decompress backup file');
        }
        
        // Check if it's a valid SQL file by looking for SQL keywords
        const preview = backupContent.slice(0, 1000).toString('utf8');
        log('Backup content preview:', preview.substring(0, 200));
        
        if (!preview.match(/^[-\s]*(?:PowerBackup|CREATE|INSERT|SET)/)) {
            log('ERROR: Invalid SQL content detected');
            log('First 1000 bytes as hex:', backupContent.slice(0, 1000).toString('hex'));
            throw new Error('Backup file does not appear to be a valid SQL dump');
        }
        
        log('Valid SQL dump detected, proceeding with database connection');
        const parsed = new URL(url);
        const connection = await mysql.createConnection({
            host: parsed.hostname,
            user: parsed.username,
            password: parsed.password,
            port: parsed.port || 3306
        });
        
        try {
            await connection.query(`CREATE DATABASE \`${tmpDbName}\``);
            log(`Created temporary database: ${tmpDbName}`);
            
            // Verify database was created
            const [databases] = await connection.query(`SHOW DATABASES LIKE '${tmpDbName}'`);
            if (databases.length === 0) {
                throw new Error(`Failed to create temporary database: ${tmpDbName}`);
            }
            log(`Database creation verified: ${tmpDbName}`);
            
            const restoreConn = await mysql.createConnection({
                host: parsed.hostname,
                user: parsed.username,
                password: parsed.password,
                database: tmpDbName,
                port: parsed.port || 3306,
                multipleStatements: true,
                maxAllowedPacket: 1073741824 // 1GB
            });
            
            try {
                // Convert to UTF-8 after validation
                backupContent = backupContent.toString('utf8');
                
                // Use multipleStatements to execute the entire dump as one statement
                log('Executing SQL dump...');
                try {
                    await restoreConn.query(backupContent);
                    log('SQL dump executed successfully');
                } catch (err) {
                    log('Error executing SQL dump:', err.message);
                    // Fallback to statement-by-statement execution
                    log('Falling back to statement-by-statement execution...');
                    await executeStatementsIndividually(restoreConn, backupContent);
                }
                
                // Run verify query
                const verifyQuery = `SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = '${tmpDbName}'`;
                const [result] = await restoreConn.query(verifyQuery);
                log(`Restore succeeded. Found ${result[0].table_count} tables in restored database`);
                
                // List the actual tables that were restored
                const [tables] = await restoreConn.query(`SHOW TABLES`);
                const tableNames = tables.map(row => Object.values(row)[0]);
                log(`Restored tables: ${tableNames.join(', ')}`);
            } finally {
                await restoreConn.end();
            }
        } finally {
            await connection.query(`DROP DATABASE IF EXISTS \`${tmpDbName}\``);
            log(`Cleaned up temporary database: ${tmpDbName}`);
            await connection.end();
        }
    } catch (error) {
        log('MySQL restore failed:', error.message);
        throw error;
    }
}

async function executeStatementsIndividually(connection, sqlContent) {
    // Split by semicolon but be more careful about quoted strings
    const statements = [];
    let currentStatement = '';
    let inString = false;
    let quoteChar = null;
    let escapeNext = false;
    
    for (let i = 0; i < sqlContent.length; i++) {
        const char = sqlContent[i];
        
        if (escapeNext) {
            currentStatement += char;
            escapeNext = false;
            continue;
        }
        
        if (char === '\\') {
            escapeNext = true;
            currentStatement += char;
            continue;
        }
        
        if ((char === "'" || char === '"') && !inString) {
            inString = true;
            quoteChar = char;
            currentStatement += char;
        } else if (char === quoteChar && inString) {
            inString = false;
            quoteChar = null;
            currentStatement += char;
        } else if (char === ';' && !inString) {
            currentStatement += char;
            if (currentStatement.trim()) {
                statements.push(currentStatement.trim());
            }
            currentStatement = '';
        } else {
            currentStatement += char;
        }
    }
    
    if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
    }
    
    log(`Executing ${statements.length} SQL statements individually...`);
    
    const skipPatterns = [/CREATE\s+USER/i, /GRANT\s+/i, /REVOKE\s+/i, /SET\s+PASSWORD/i];
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
        if (statement.trim()) {
            if (skipPatterns.some(re => re.test(statement))) {
                log('Skipping permission/role statement');
                continue;
            }
            try {
                // Check if connection is still alive
                if (connection.state === 'disconnected') {
                    throw new Error('Connection lost during restore');
                }
                
                await connection.query(statement);
                successCount++;
                
                // Log progress for large restores
                if (successCount % 10 === 0) {
                    log(`Progress: ${successCount}/${statements.length} statements executed successfully`);
                }
            } catch (err) {
                errorCount++;
                if (errorCount <= 5) { // Only log first 5 errors to avoid spam
                    log(`Error executing statement (${errorCount}):`, err.message);
                }
                
                // If connection is lost, break out of the loop
                if (err.message.includes('connection') || err.message.includes('closed')) {
                    log('Connection lost, stopping execution');
                    break;
                }
            }
        }
    }
    
    log(`Statement execution complete: ${successCount} successful, ${errorCount} errors`);
    
    if (successCount === 0 && errorCount > 0) {
        throw new Error('No statements were executed successfully');
    }
}

async function testRestorePostgres(url, backupFile, tmpDbName, dbConfig) {
    try {
        log('Reading backup file...');
        const fileStats = await fs.stat(backupFile);
        log(`Backup file size: ${fileStats.size} bytes`);
        
        const compressedData = await fs.readFile(backupFile);
        log(`Read ${compressedData.length} bytes from backup file`);
        
        log('Decompressing backup data...');
        const { gunzipSync } = await import('zlib');
        
        let backupContent;
        try {
            backupContent = gunzipSync(compressedData);
            log('Successfully decompressed backup data');
        } catch (err) {
            log('Failed to decompress backup:', err.message);
            throw new Error('Failed to decompress backup file');
        }
        
        // Check if it's a valid SQL file by looking for SQL keywords
        const preview = backupContent.slice(0, 1000).toString('utf8');
        log('Backup content preview:', preview.substring(0, 200));
        
        if (!preview.match(/^[-\s]*(?:PowerBackup|CREATE|INSERT|SET|COPY)/)) {
            log('ERROR: Invalid SQL content detected');
            log('First 1000 bytes as hex:', backupContent.slice(0, 1000).toString('hex'));
            throw new Error('Backup file does not appear to be a valid PostgreSQL dump');
        }
        
        log('Valid SQL dump detected, proceeding with database connection');
        
        const client = new pg.Client({ 
            connectionString: url,
            database: 'postgres' // Connect to default db first
        });
        
        await client.connect();
        
        try {
            await client.query(`CREATE DATABASE "${tmpDbName}"`);
            log(`Created temporary database: ${tmpDbName}`);
            
            const restoreClient = new pg.Client({ 
                connectionString: url,
                database: tmpDbName
            });
            
            try {
                await restoreClient.connect();
                
                // Convert to UTF-8 after validation
                backupContent = backupContent.toString('utf8');
                
                log('Executing SQL dump...');
                try {
                    await restoreClient.query(backupContent);
                    log('SQL dump executed successfully');
                } catch (err) {
                    log('Error executing SQL dump:', err.message);
                    // Fallback to statement-by-statement execution
                    log('Falling back to statement-by-statement execution...');
                    await executePostgresStatementsIndividually(restoreClient, backupContent);
                }

                // Run verify query
                const verifyQuery = dbConfig.test_restore?.verify_query || 'SELECT COUNT(*) FROM information_schema.tables';
                const result = await restoreClient.query(verifyQuery);
                log(`Restore succeeded. Found ${result.rows[0].count} tables in restored database`);
            } finally {
                await restoreClient.end();
            }
        } finally {
            await client.query(`DROP DATABASE IF EXISTS "${tmpDbName}"`);
            await client.end();
        }
    } catch (error) {
        log('Postgres restore failed:', error.message);
        throw error;
    }
}

async function executePostgresStatementsIndividually(client, sqlContent) {
    const statements = sqlContent
        .split(';')
        .filter(s => s.trim())
        .map(s => s.trim());

    const skipPatterns = [
        /CREATE\s+USER/i,
        /GRANT\s+/i,
        /REVOKE\s+/i,
        /ALTER\s+ROLE/i,
        /CREATE\s+ROLE/i
    ];

    log(`Executing ${statements.length} SQL statements individually...`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
        if (skipPatterns.some(re => re.test(statement))) {
            log('Skipping permission/role statement');
            continue;
        }
        try {
            await client.query(statement);
            successCount++;
        } catch (err) {
            errorCount++;
            if (errorCount <= 3) { // Only log first 3 errors to avoid spam
                log(`Error executing statement (${errorCount}):`, err.message);
            }
        }
    }
    
    log(`Statement execution complete: ${successCount} successful, ${errorCount} errors`);
}
