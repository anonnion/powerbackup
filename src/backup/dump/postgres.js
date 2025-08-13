import pg from 'pg';
import { createWriteStream } from 'fs';
import { log } from '../../utils/logger.js';

export async function createPostgresDump(url, outputPath) {
    let client;
    try {
        client = new pg.Client({ connectionString: url });
        await client.connect();
        
        const writeStream = createWriteStream(outputPath);
        writeStream.write('-- PowerBackup PostgreSQL dump\n');
        writeStream.write(`-- Created at: ${new Date().toISOString()}\n\n`);
        
        // Get all tables in public schema
        const tables = await client.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        
        log.info(`Found ${tables.rows.length} tables to dump`);
        
        for (const table of tables.rows) {
            const tableName = table.tablename;
            log.info(`Dumping table: ${tableName}`);
            
            try {
                // Get create table statement
                const createTable = await client.query(`
                    SELECT pg_get_tabledef('${tableName}'::regclass);
                `);
                
                writeStream.write(`DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`);
                writeStream.write(createTable.rows[0].pg_get_tabledef + ';\n\n');

                // Get data
                const result = await client.query(`SELECT * FROM "${tableName}"`);
                if (result.rows.length > 0) {
                    const columns = Object.keys(result.rows[0]);
                    writeStream.write(`COPY "${tableName}" (${columns.map(c => `"${c}"`).join(',')}) FROM stdin;\n`);
                    
                    result.rows.forEach(row => {
                        const values = columns.map(col => {
                            const val = row[col];
                            if (val === null) return '\\N';
                            return val.toString().replace(/\t/g, '\\t')
                                              .replace(/\n/g, '\\n')
                                              .replace(/\r/g, '\\r');
                        });
                        writeStream.write(values.join('\t') + '\n');
                    });
                    
                    writeStream.write('\\.\n\n');
                }
            } catch (tableError) {
                log.error(`Error dumping table ${tableName}:`, tableError);
                // Continue with other tables
            }
        }
        
        await new Promise(resolve => writeStream.end(resolve));
        log.success('PostgreSQL dump completed successfully');
    } catch (error) {
        throw new Error(`Postgres dump failed: ${error.message}`);
    } finally {
        if (client) await client.end();
    }
}
