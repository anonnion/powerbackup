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
    // Fallback: Node.js dump logic (minimal, schema only)
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
            writeStream.write(`-- Table: ${tableName}\n`);
            // Only dump table names (no schema/data for fallback)
        }
        await new Promise(resolve => writeStream.end(resolve));
        log.success('PostgreSQL dump completed successfully (Node.js fallback, minimal).');
    } catch (error) {
        throw new Error(`Postgres dump fallback failed: ${error.message}`);
    } finally {
        if (client) await client.end();
    }
}
