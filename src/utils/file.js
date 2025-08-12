import fs from 'fs/promises';
import { file as tmpFile } from 'tmp-promise';
import { createReadStream, createWriteStream } from 'fs';
import { gunzipSync } from 'zlib';
import * as openpgp from 'openpgp';
import { pipeline } from 'stream/promises';
import { log } from './logger.js';

export async function decryptBackupFile(filePath, config) {
	try {
		if (!filePath.endsWith('.gpg')) return filePath;
		log.info('Decrypting backup...');
		
		if (!config.gpg?.symmetric_passphrase_file) {
			throw new Error('No passphrase file configured for decryption');
		}
		
		const encryptedData = await fs.readFile(filePath);
		const passphrase = (await fs.readFile(config.gpg.symmetric_passphrase_file, 'utf8')).trim();
		
		if (!passphrase) {
			throw new Error('Empty passphrase in passphrase file');
		}
		
		const message = await openpgp.readMessage({ 
			binaryMessage: encryptedData 
		});
		
		const result = await openpgp.decrypt({ 
			message, 
			passwords: [passphrase],
			format: 'binary'
		});
		
		const decryptedData = Buffer.from(result.data);
		const { path: tmpPath } = await tmpFile();
		await fs.writeFile(tmpPath, decryptedData);
		
		log.success('Decryption successful');
		return tmpPath;
	} catch (error) {
		log.error('Decryption failed:', error.message);
		throw error;
	}
}

export async function decompressBackupFile(filePath) {
	try {
		if (!filePath.endsWith('.gz')) {
			return filePath;
		}
		log.info('Decompressing backup...');
		const { gunzipSync } = await import('zlib');
		
		// Read the entire file and decompress it in memory
		const compressedData = await fs.readFile(filePath);
		const decompressedData = gunzipSync(compressedData);
		
		// Basic validation that it's SQL content
		const preview = decompressedData.toString('utf8').slice(0, 1000);
		if (!preview.match(/^[-\s]*(?:PowerBackup|CREATE|INSERT|SET|COPY)/)) {
			throw new Error('Decompressed content does not appear to be valid SQL dump');
		}
		
		// Write to temporary file
		const { path: tmpPath } = await tmpFile();
		await fs.writeFile(tmpPath, decompressedData);
		
		log.success('Decompression successful');
		return tmpPath;
	} catch (error) {
		log.error('Decompression failed:', error.message);
		throw error;
	}
}
