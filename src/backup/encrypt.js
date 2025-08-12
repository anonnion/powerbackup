import fs from 'fs/promises';
import path from 'path';
import * as openpgp from 'openpgp';

export async function encryptFile(inputPath, outputPath, config, recipients = []) {
    try {
        if (!recipients.length && !config.gpg?.symmetric_passphrase_file) {
            return false;
        }
        const inputData = await fs.readFile(inputPath);
        let encryptionKey;
        if (recipients.length > 0) {
            // Use public key encryption
            const publicKeys = await Promise.all(
                recipients.map(async id => {
                    const keyData = await fs.readFile(path.join(config.keyring_path, `${id}.pub`));
                    return await openpgp.readKey({ armoredKey: keyData.toString() });
                })
            );
            encryptionKey = publicKeys;
        } else {
            // Use symmetric encryption
            const passphrase = await fs.readFile(config.gpg.symmetric_passphrase_file, 'utf8');
            encryptionKey = passphrase.trim();
        }
        const message = await openpgp.createMessage({ binary: inputData });
        const encrypted = await openpgp.encrypt({
            message,
            format: 'binary',
            passwords: recipients.length ? undefined : encryptionKey,
            encryptionKeys: recipients.length ? encryptionKey : undefined
        });
        await fs.writeFile(outputPath, encrypted);
        return true;
    } catch (error) {
        throw new Error(`Encryption failed: ${error.message}`);
    }
}
