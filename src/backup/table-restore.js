import mysql from 'mysql2/promise';
import pg from 'pg';
import fs from 'fs/promises';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { log } from '../utils/logger.js';

export async function listBackupTables(dbConfig, backupFile) {
    try {
        log.info(`🔍 Analyzing backup file to extract table information...`);
        
        let processedFile = backupFile;
        
        // Decrypt if needed
        if (processedFile.endsWith('.gpg')) {
            log.info('🔓 Decrypting backup for analysis...');
            const { decryptBackupFile } = await import('../utils/file.js');
            processedFile = await decryptBackupFile(processedFile, { gpg: { symmetric_passphrase_file: './src/config/passphrase' } });
        }
        
        // Read and process backup file
        const compressedData = await fs.readFile(processedFile);
        const { gunzipSync } = await import('zlib');
        const backupContent = gunzipSync(compressedData).toString('utf8');
        
        // Extract table names from CREATE TABLE statements
        let tableMatches;
        if (dbConfig.type === 'postgres') {
            // PostgreSQL uses double quotes and different syntax
            tableMatches = backupContent.match(/CREATE TABLE "([^"]+)"/g);
            const tables = tableMatches ? tableMatches.map(match => {
                const tableName = match.match(/CREATE TABLE "([^"]+)"/)[1];
                return tableName;
            }) : [];
            log.table.list(tables);
            return tables;
        } else {
            // MySQL uses backticks
            tableMatches = backupContent.match(/CREATE TABLE `([^`]+)`/g);
            const tables = tableMatches ? tableMatches.map(match => {
                const tableName = match.match(/CREATE TABLE `([^`]+)`/)[1];
                return tableName;
            }) : [];
            log.table.list(tables);
            return tables;
        }
    } catch (error) {
        log.error(`Failed to analyze backup file: ${error.message}`);
        throw error;
    }
}

export async function restoreTable(dbConfig, backupFile, targetTable, targetDatabase = null) {
    try {
        const url = dbConfig.url_env ? process.env[dbConfig.url_env] : dbConfig.url;
        if (!url) {
            throw new Error(`No URL available for database ${dbConfig.name}`);
        }
        
        const restoreDbName = targetDatabase || dbConfig.name;
        log.table.restore(targetTable);
        
        if (dbConfig.type === 'mysql') {
            await restoreTableMysql(url, backupFile, targetTable, restoreDbName, dbConfig);
        } else if (dbConfig.type === 'postgres') {
            await restoreTablePostgres(url, backupFile, targetTable, restoreDbName, dbConfig);
        } else {
            throw new Error(`Unsupported database type: ${dbConfig.type}`);
        }
        
        log.table.restored(targetTable);
    } catch (error) {
        log.table.error(targetTable, error.message);
        throw error;
    }
}

async function restoreTableMysql(url, backupFile, targetTable, targetDbName, dbConfig) {
    try {
        let processedFile = backupFile;
        
        // Decrypt if needed
        if (processedFile.endsWith('.gpg')) {
            log.info('🔓 Decrypting backup...');
            const { decryptBackupFile } = await import('../utils/file.js');
            processedFile = await decryptBackupFile(processedFile, { gpg: { symmetric_passphrase_file: './src/config/passphrase' } });
        }
        
        // Read and decompress backup
        const compressedData = await fs.readFile(processedFile);
        const { gunzipSync } = await import('zlib');
        const backupContent = gunzipSync(compressedData).toString('utf8');
        
        // Extract table-specific SQL
        const tableSQL = extractTableSQL(backupContent, targetTable);
        if (!tableSQL) {
            throw new Error(`Table ${targetTable} not found in backup`);
        }
        
        const parsed = new URL(url);
        const connection = await mysql.createConnection({
            host: parsed.hostname,
            user: parsed.username,
            password: parsed.password,
            database: targetDbName,
            port: parsed.port || 3306,
            multipleStatements: true
        });
        
        try {
            log.info(`🗑️ Dropping existing table ${chalk.yellow(targetTable)} if exists...`);
            await connection.query(`DROP TABLE IF EXISTS \`${targetTable}\``);
            
            log.info(`⚡ Executing table creation and data insertion...`);
            await connection.query(tableSQL);
            
            // Verify table was created
            const [tables] = await connection.query(`SHOW TABLES LIKE '${targetTable}'`);
            if (tables.length === 0) {
                throw new Error(`Failed to create table ${targetTable}`);
            }
            
            // Get row count
            const [result] = await connection.query(`SELECT COUNT(*) as count FROM \`${targetTable}\``);
            log.success(`📊 Table ${chalk.yellow(targetTable)} restored with ${chalk.green(result[0].count)} rows`);
            
        } finally {
            await connection.end();
        }
    } catch (error) {
        log.error(`MySQL table restore failed: ${error.message}`);
        throw error;
    }
}

async function restoreTablePostgres(url, backupFile, targetTable, targetDbName, dbConfig) {
    try {
        // Read and decompress backup
        const compressedData = await fs.readFile(backupFile);
        const { gunzipSync } = await import('zlib');
        const backupContent = gunzipSync(compressedData).toString('utf8');
        
        // Extract table-specific SQL
        const tableSQL = extractPostgresTableSQL(backupContent, targetTable);
        if (!tableSQL) {
            throw new Error(`Table ${targetTable} not found in backup`);
        }
        
        const client = new pg.Client({ 
            connectionString: url,
            database: targetDbName
        });
        
        await client.connect();
        
        try {
            log.info(`🗑️ Dropping existing table ${chalk.yellow(targetTable)} if exists...`);
            await client.query(`DROP TABLE IF EXISTS "${targetTable}" CASCADE`);
            
            log.info(`⚡ Executing table creation and data insertion...`);
            await client.query(tableSQL);
            
            // Verify table was created
            const result = await client.query(`SELECT COUNT(*) as count FROM "${targetTable}"`);
            log.success(`📊 Table ${chalk.yellow(targetTable)} restored with ${chalk.green(result.rows[0].count)} rows`);
            
        } finally {
            await client.end();
        }
    } catch (error) {
        log.error(`PostgreSQL table restore failed: ${error.message}`);
        throw error;
    }
}

function extractTableSQL(backupContent, tableName) {
    const lines = backupContent.split('\n');
    let inTargetTable = false;
    let tableSQL = [];
    let braceCount = 0;
    let foundTable = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for CREATE TABLE statement for our target table
        if (line.includes(`CREATE TABLE \`${tableName}\``)) {
            inTargetTable = true;
            foundTable = true;
            tableSQL.push(line);
            continue;
        }
        
        // If we're in the target table, collect lines
        if (inTargetTable) {
            tableSQL.push(line);
            
            // Count braces to detect end of CREATE TABLE
            braceCount += (line.match(/\(/g) || []).length;
            braceCount -= (line.match(/\)/g) || []).length;
            
            // If we've closed all braces and hit a semicolon, we're done with CREATE TABLE
            if (braceCount === 0 && line.trim().endsWith(';')) {
                // Look for INSERT statements for this table
                let j = i + 1;
                while (j < lines.length) {
                    const nextLine = lines[j];
                    
                    // Check if we've moved to the next table
                    if (nextLine.includes('CREATE TABLE') && !nextLine.includes(`\`${tableName}\``)) {
                        break;
                    }
                    
                    // Check for INSERT statements for our table
                    if (nextLine.includes(`INSERT INTO \`${tableName}\``)) {
                        tableSQL.push(nextLine);
                        
                        // Continue collecting INSERT lines until we hit a semicolon
                        j++;
                        while (j < lines.length && !lines[j].trim().endsWith(';')) {
                            tableSQL.push(lines[j]);
                            j++;
                        }
                        if (j < lines.length) {
                            tableSQL.push(lines[j]); // Add the semicolon line
                        }
                    } else {
                        j++;
                    }
                }
                break;
            }
        }
    }
    
    if (!foundTable) {
        return null;
    }
    
    const result = tableSQL.join('\n');
    return result.trim() ? result : null;
}

function extractPostgresTableSQL(backupContent, tableName) {
    const lines = backupContent.split('\n');
    let inTargetTable = false;
    let tableSQL = [];
    let braceCount = 0;
    
    for (const line of lines) {
        // Check for CREATE TABLE statement
        if (line.includes(`CREATE TABLE "${tableName}"`)) {
            inTargetTable = true;
            tableSQL.push(line);
            continue;
        }
        
        // If we're in the target table, collect lines
        if (inTargetTable) {
            tableSQL.push(line);
            
            // Count braces to detect end of CREATE TABLE
            braceCount += (line.match(/\(/g) || []).length;
            braceCount -= (line.match(/\)/g) || []).length;
            
            // If we've closed all braces, look for INSERT statements
            if (braceCount === 0 && line.trim().endsWith(';')) {
                // Continue collecting INSERT statements for this table
                continue;
            }
            
            // Check if we've moved to the next table
            if (line.includes('CREATE TABLE') && !line.includes(`"${tableName}"`)) {
                break;
            }
        }
    }
    
    return tableSQL.join('\n');
}

export async function interactiveTableRestore(dbConfig, backupFile, targetDatabase = null) {
    try {
        log.info(`🎯 Starting interactive table restore...`);
        
        // List available tables
        const tables = await listBackupTables(dbConfig, backupFile);
        
        if (tables.length === 0) {
            log.warn(`⚠️ No tables found in backup file`);
            return;
        }
        
        // Interactive table selection
        const { selectedTables } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selectedTables',
                message: 'Select tables to restore:',
                choices: tables.map(table => ({
                    name: table,
                    value: table,
                    checked: false
                })),
                validate: (input) => {
                    if (input.length === 0) {
                        return 'Please select at least one table';
                    }
                    return true;
                }
            }
        ]);
        
        if (selectedTables.length === 0) {
            log.info(`👋 No tables selected, exiting...`);
            return;
        }
        
        log.info(`🚀 Restoring ${chalk.green(selectedTables.length)} selected tables...`);
        
        // Restore each selected table
        for (const table of selectedTables) {
            try {
                await restoreTable(dbConfig, backupFile, table, targetDatabase);
            } catch (error) {
                log.error(`Failed to restore table ${table}: ${error.message}`);
                // Continue with other tables
            }
        }
        
        log.success(`🎉 Table restore completed!`);
        
    } catch (error) {
        log.error(`Interactive table restore failed: ${error.message}`);
        throw error;
    }
}
