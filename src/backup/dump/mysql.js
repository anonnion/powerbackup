import mysql from 'mysql2/promise';
import { createWriteStream } from 'fs';
import { log } from '../../utils/logger.js';

// Proper SQL escaping function
function escapeSQLValue(value) {
    if (value === null) return 'NULL';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? '1' : '0';
    
    // Handle Date objects
    if (value instanceof Date) {
        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    
    // Convert to string and escape properly
    const str = value.toString();
    
    // Check if it looks like a date string that needs formatting
    if (str.match(/^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{2}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT/)) {
        try {
            const date = new Date(str);
            return `'${date.toISOString().slice(0, 19).replace('T', ' ')}'`;
        } catch (e) {
            // If date parsing fails, escape as string
        }
    }
    
    return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}'`;
}

export async function createMySQLDump(url, outputPath, schemaOnly = false) {
    // Try mysqldump CLI first
    try {
        await runMySQLDump(url, outputPath, schemaOnly);
        log.info('Used mysqldump CLI for MySQL backup.');
        return;
    } catch (cliErr) {
        log.warn('mysqldump CLI failed, falling back to Node.js dump:', cliErr.message);
    }
    // Fallback: Node.js dump logic
    let connection;
    try {
        const parsed = new URL(url);
        connection = await mysql.createConnection({
            host: parsed.hostname,
            user: parsed.username,
            password: parsed.password,
            database: parsed.pathname.slice(1),
            port: parsed.port || 3306
        });
        const [rows] = await connection.query('SHOW TABLES');
        const tables = rows.map(row => Object.values(row)[0]);
        log.info(`Found ${tables.length} tables to dump${schemaOnly ? ' (schema only)' : ''}`);
        const writeStream = createWriteStream(outputPath);
        writeStream.write('-- PowerBackup MySQL dump\n');
        writeStream.write(`-- Created at: ${new Date().toISOString()}\n`);
        if (schemaOnly) {
            writeStream.write('-- Schema only (no data)\n');
        }
        writeStream.write('\n');
        writeStream.write('SET FOREIGN_KEY_CHECKS=0;\n\n');
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            log.backup.progress(table, i + 1, tables.length);
            try {
                // Get create table statement
                const [createTable] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
                writeStream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
                writeStream.write(createTable[0]['Create Table'] + ';\n\n');
                // Get data only if not schema-only
                if (!schemaOnly) {
                    const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
                    if (rows.length > 0) {
                        const columns = Object.keys(rows[0]);
                        writeStream.write(`INSERT INTO \`${table}\` (\`${columns.join('`,`')}\`) VALUES\n`);
                        rows.forEach((row, idx) => {
                            const values = columns.map(col => {
                                const val = row[col];
                                return escapeSQLValue(val);
                            });
                            writeStream.write(`(${values.join(',')})`);
                            writeStream.write(idx === rows.length - 1 ? ';\n\n' : ',\n');
                        });
                    }
                }
            } catch (tableError) {
                log.warn(`Error dumping table ${table}:`, tableError);
                // Continue with other tables
            }
        }
        writeStream.write('SET FOREIGN_KEY_CHECKS=1;\n');
        await new Promise(resolve => writeStream.end(resolve));
        log.success('MySQL dump completed successfully (Node.js fallback).');
    } catch (error) {
        throw new Error(`MySQL dump failed: ${error.message}`);
    } finally {
        if (connection) await connection.end();
    }
}
