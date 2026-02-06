import crypto from 'crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(config.encryptionKey, 'hex');

/**
 * Vault Service - Handles encryption and decryption of sensitive data
 */
export class VaultService {
    /**
     * Encrypt sensitive data
     * @param {string} text - Plain text to encrypt
     * @returns {object} - Encrypted data with IV
     */
    static encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            return {
                encryptedData: encrypted,
                iv: iv.toString('hex')
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Encrypted hex string
     * @param {string} ivHex - Initialization vector in hex
     * @returns {string} - Decrypted plain text
     */
    static decrypt(encryptedData, ivHex) {
        try {
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Hash sensitive data (one-way)
     * @param {string} data - Data to hash
     * @returns {string} - SHA256 hash
     */
    static hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}
