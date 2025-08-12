import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import AdmZip from 'adm-zip';

export async function compressFile(inputPath, outputPath, method = 'zip') {
    try {
        if (method === 'gzip') {
            const source = createReadStream(inputPath);
            const gzip = createGzip();
            const destination = createWriteStream(outputPath);
            await pipeline(source, gzip, destination);
        } else if (method === 'zip') {
            const zip = new AdmZip();
            zip.addLocalFile(inputPath);
            zip.writeZip(outputPath);
        } else {
            throw new Error(`Unsupported compression method: ${method}`);
        }
    } catch (error) {
        throw new Error(`Compression failed: ${error.message}`);
    }
}
