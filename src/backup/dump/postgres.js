import { runPgDump } from './pgdump.js';
import { log } from '../../utils/logger.js';

export async function createPostgresDump(url, outputPath) {
    // Try pg_dump CLI first
    try {
        await runPgDump(url, outputPath);
        log.info('Used pg_dump CLI for Postgres backup.');
        return;
    } catch (cliErr) {
        log.warn('pg_dump CLI failed, falling back to Node.js dump:', cliErr.message);
    }
    
    // Fallback: Node.js dump logic (schema only)
    const pg = await import('pg');
    const { createWriteStream } = await import('fs');
    let client;
    try {
        client = new pg.Client({ connectionString: url });
        await client.connect();
        const writeStream = createWriteStream(outputPath);
        writeStream.write('-- PowerBackup PostgreSQL dump (fallback)\n');
        writeStream.write(`-- Created at: ${new Date().toISOString()}\n\n`);
        
        // Get all tables in public schema
        const tables = await client.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        log.info(`Found ${tables.rows.length} tables to dump (fallback)`);
        
        for (const table of tables.rows) {
            const tableName = table.tablename;
            log.info(`Dumping table: ${tableName}`);
            
            try {
                // Get table structure
                const structure = await client.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND table_schema = 'public'
                    ORDER BY ordinal_position
                `, [tableName]);
                
                writeStream.write(`-- Table: ${tableName}\n`);
                writeStream.write(`CREATE TABLE IF NOT EXISTS "${tableName}" (\n`);
                
                const columns = [];
                for (const col of structure.rows) {
                    let colDef = `  "${col.column_name}" ${col.data_type}`;
                    if (col.is_nullable === 'NO') {
                        colDef += ' NOT NULL';
                    }
                    if (col.column_default) {
                        colDef += ` DEFAULT ${col.column_default}`;
                    }
                    columns.push(colDef);
                }
                
                writeStream.write(columns.join(',\n'));
                writeStream.write('\n);\n\n');
                
                // Get table data count for info
                const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
                writeStream.write(`-- Table ${tableName} has ${countResult.rows[0].count} rows\n\n`);
                
            } catch (tableError) {
                log.error(`Error dumping table ${tableName}: ${tableError.message}`);
                writeStream.write(`-- Error dumping table ${tableName}: ${tableError.message}\n\n`);
            }
        }
        
        await new Promise(resolve => writeStream.end(resolve));
        log.success('PostgreSQL dump completed successfully (Node.js fallback, schema only).');
    } catch (error) {
        throw new Error(`Postgres dump fallback failed: ${error.message}`);
    } finally {
        if (client) await client.end();
    }
}
