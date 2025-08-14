import fs from 'fs/promises';
import path from 'path';
import { file as tmpFile } from 'tmp-promise';
import { format } from 'date-fns';
import { log } from '../utils/logger.js';
import { compressFile } from './compress.js';
import { encryptFile } from './encrypt.js';
import { createMySQLDump } from './dump/mysql.js';
import { createPostgresDump } from './dump/postgres.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as openpgp from 'openpgp';
import * as crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

import { PKG_VERSION } from '../utils/pkg-version.js';

export class BackupManager {
    constructor(config) {
        this.config = config;
    }

    async createDump(dbConfig, outputPath) {
        const url = dbConfig.url_env ? process.env[dbConfig.url_env] : dbConfig.url;
        if (!url) {
            throw new Error(`No URL available for database ${dbConfig.name}`);
        }
        if (dbConfig.type === 'mysql') {
            await createMySQLDump(url, outputPath);
        } else if (dbConfig.type === 'postgres') {
            await createPostgresDump(url, outputPath);
        } else {
            throw new Error(`Unsupported database type: ${dbConfig.type}`);
        }
    }

    async performBackup(dbConfig, schemaOnly = false) {
        const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
        const fileName = `${dbConfig.name}_${timestamp}.sql`;
        const { path: sqlPath, cleanup } = await tmpFile();
        let gzPath, decompPath, finalPath, destPath, metaPath;
        try {
            log.backup.start(dbConfig.name);
            log.debug(`[DEBUG] sqlPath: ${sqlPath}`);
            await this.createDump(dbConfig, sqlPath, schemaOnly);
            log.debug(`[DEBUG] Dump created at: ${sqlPath}`);
            // Validate SQL dump
            const sqlData = await fs.readFile(sqlPath);
            const sqlPreview = sqlData.toString('utf8').split('\n').slice(0, 5).join('\n');
            log.info('SQL dump preview:', sqlPreview);
            
            // More flexible validation - check for common SQL patterns anywhere in the file
            const sqlContent = sqlData.toString('utf8');
            if (!sqlContent.match(/(?:CREATE|INSERT|SET|COPY|--|PowerBackup)/)) {
                throw new Error('Generated SQL dump does not appear to be valid');
            }
            // Compress using gzip
            log.compression.start();
            gzPath = sqlPath + '.gz';
            await compressFile(sqlPath, gzPath, 'gzip');
            log.debug(`[DEBUG] gzPath: ${gzPath}`);
            // Verify compression by decompressing a sample
            const { createGunzip } = await import('zlib');
            const gunzip = createGunzip();
            ({ path: decompPath } = await tmpFile());
            log.debug(`[DEBUG] decompPath: ${decompPath}`);
            const readStream = createReadStream(gzPath);
            const writeStream = createWriteStream(decompPath);
            await pipeline(readStream, gunzip, writeStream);
            const decompData = await fs.readFile(decompPath);
            const decompPreview = decompData.toString('utf8').split('\n').slice(0, 5).join('\n');
            log.compression.complete();
            await fs.unlink(decompPath);
            await fs.unlink(sqlPath);
            // Encrypt if configured
            finalPath = gzPath;
            let encrypted = false;
            const recipients = dbConfig.recipients || this.config.gpg?.recipients || [];
            if (recipients.length || this.config.gpg?.symmetric_passphrase_file) {
                log.encryption.start();
                finalPath = gzPath + '.gpg';
                log.debug(`[DEBUG] finalPath (for encryption): ${finalPath}`);
                encrypted = await encryptFile(gzPath, finalPath, this.config, recipients);
                log.encryption.complete();
                await fs.unlink(gzPath);
            }
            // Calculate checksum
            log.debug(`[DEBUG] finalPath (for checksum): ${finalPath}`);
            const checksum = await this.calculateChecksum(finalPath);
            // Create metadata
            const meta = {
                tool_version: PKG_VERSION,
                db: dbConfig.name,
                file: path.basename(finalPath),
                timestamp: new Date().toISOString(),
                recipients,
                encrypted,
                sha256: checksum
            };
            // Move to backup directory
            const backupDir = path.join(this.config.backup_dir, dbConfig.name, 'hourly');
            await fs.mkdir(backupDir, { recursive: true });
            destPath = path.join(backupDir, path.basename(finalPath));
            log.debug(`[DEBUG] destPath: ${destPath}`);
            if (!finalPath || typeof finalPath !== 'string') {
                throw new Error(`[BUG] finalPath is invalid: ${finalPath}`);
            }
            await fs.rename(finalPath, destPath);
            metaPath = destPath + '.meta.json';
            log.debug(`[DEBUG] metaPath: ${metaPath}`);
            await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
            log.backup.complete(dbConfig.name, path.basename(destPath));
            // Upload to S3 if configured
            try {
                await this.uploadToS3(destPath);
            } catch (e) {
                log.warn('S3 upload failed:', e.message);
            }
            return destPath;
        } catch (error) {
            log.backup.error(dbConfig.name, error.message, {
                sqlPath, gzPath, decompPath, finalPath, destPath, metaPath
            });
            throw error;
        } finally {
            cleanup();
        }
    }

    async testRestore(dbConfig, backupFile) {
        try {
            log(`Testing restore for ${dbConfig.name}...`);
            let processedFile = backupFile;
            
            // Decrypt if needed
            if (processedFile.endsWith('.gpg')) {
                log('Decrypting backup...');
                const { decryptBackupFile } = await import('../utils/file.js');
                processedFile = await decryptBackupFile(processedFile, this.config);
            }
            
            // Decompress if needed
            if (processedFile.endsWith('.gz')) {
                log('Decompressing backup...');
                const { decompressBackupFile } = await import('../utils/file.js');
                processedFile = await decompressBackupFile(processedFile);
            }
            
            // Log preview of processed file
            try {
                const data = await fs.readFile(processedFile);
                const preview = data.slice(0, 500).toString('utf8');
                if (preview.match(/^[-\s]*(?:PowerBackup|CREATE|INSERT|SET|COPY)/)) {
                    log('Backup content verified');
                } else {
                    log('Warning: Backup content may not be valid SQL');
                }
            } catch (e) {
                log('Failed to preview backup content:', e.message);
            }
            
            const { restoreBackup } = await import('./restore.js');
            await restoreBackup(dbConfig, processedFile);
            
            log('Restore test completed successfully');
        } catch (error) {
            log('Restore test failed:', error.message);
            throw error;
        }
    }

    async actualRestore(dbConfig, backupFile, targetDatabase = null) {
        try {
            log(`Starting actual restore for ${dbConfig.name}...`);
            let processedFile = backupFile;
            
            // Decrypt if needed
            if (processedFile.endsWith('.gpg')) {
                log('Decrypting backup...');
                const { decryptBackupFile } = await import('../utils/file.js');
                processedFile = await decryptBackupFile(processedFile, this.config);
            }
            
            // Decompress if needed
            if (processedFile.endsWith('.gz')) {
                log('Decompressing backup...');
                const { decompressBackupFile } = await import('../utils/file.js');
                processedFile = await decompressBackupFile(processedFile);
            }
            
            const { actualRestore } = await import('./actual-restore.js');
            await actualRestore(dbConfig, processedFile, targetDatabase);
            
            log('Actual restore completed successfully');
        } catch (error) {
            log('Actual restore failed:', error.message);
            throw error;
        }
    }

    async calculateChecksum(filePath) {
        const hash = crypto.createHash('sha256');
        const data = await fs.readFile(filePath);
        hash.update(data);
        return hash.digest('hex');
    }

    async uploadToS3(filePath) {
        if (!this.config.s3?.bucket) {
            return;
        }
        const s3 = new S3Client({
            credentials: this.config.s3.aws_profile ? {
                profile: this.config.s3.aws_profile
            } : undefined
        });
        const fileStream = createReadStream(filePath);
        const command = new PutObjectCommand({
            Bucket: this.config.s3.bucket,
            Key: path.basename(filePath),
            Body: fileStream
        });
        await s3.send(command);
    }
}
