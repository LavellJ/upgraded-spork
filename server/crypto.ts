// Encryption at rest utilities for user documents
import crypto from 'crypto';
import { scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES-GCM standard
const TAG_LENGTH = 16; // AES-GCM standard
const SALT_LENGTH = 32;

export interface EncryptedPayload {
  iv: string;          // Base64 encoded initialization vector
  ciphertext: string;  // Base64 encoded encrypted data
  tag: string;         // Base64 encoded authentication tag
  salt: string;        // Base64 encoded salt used for key derivation
}

/**
 * Derive encryption key from JWT_SECRET using scrypt KDF
 */
export async function deriveKey(secret: string, salt: Buffer): Promise<Buffer> {
  if (!secret) {
    throw new Error('JWT_SECRET not available for key derivation');
  }
  
  // Use scrypt with recommended parameters for key derivation
  const key = await scryptAsync(secret, salt, 32) as Buffer;
  return key;
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Buffer {
  return crypto.randomBytes(SALT_LENGTH);
}

/**
 * Encrypt a buffer using AES-256-GCM
 */
export async function encrypt(plaintext: Buffer, secret: string): Promise<EncryptedPayload> {
  if (!plaintext || plaintext.length === 0) {
    throw new Error('Plaintext cannot be empty');
  }
  
  if (!secret) {
    throw new Error('Secret key required for encryption');
  }

  // Generate random IV and salt
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = generateSalt();
  
  // Derive encryption key from secret + salt
  const key = await deriveKey(secret, salt);
  
  // Create cipher with proper GCM mode  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(salt); // Use salt as additional authenticated data
  
  // Encrypt the data
  const encrypted = Buffer.concat([
    cipher.update(plaintext),
    cipher.final()
  ]);
  
  // Get the authentication tag
  const tag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('base64'),
    ciphertext: encrypted.toString('base64'),
    tag: tag.toString('base64'),
    salt: salt.toString('base64')
  };
}

/**
 * Decrypt an encrypted payload using AES-256-GCM
 */
export async function decrypt(payload: EncryptedPayload, secret: string): Promise<Buffer> {
  if (!payload || !payload.iv || !payload.ciphertext || !payload.tag || !payload.salt) {
    throw new Error('Invalid encrypted payload structure');
  }
  
  if (!secret) {
    throw new Error('Secret key required for decryption');
  }

  try {
    // Parse components from base64
    const iv = Buffer.from(payload.iv, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');
    const salt = Buffer.from(payload.salt, 'base64');
    
    // Derive the same key using stored salt
    const key = await deriveKey(secret, salt);
    
    // Create decipher with proper GCM mode
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(salt); // Use same salt as AAD
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Encrypt JSON data for storage
 */
export async function encryptJSON(data: any, secret: string): Promise<EncryptedPayload> {
  const jsonString = JSON.stringify(data);
  const plaintext = Buffer.from(jsonString, 'utf8');
  return encrypt(plaintext, secret);
}

/**
 * Decrypt and parse JSON data from storage
 */
export async function decryptJSON(payload: EncryptedPayload, secret: string): Promise<any> {
  const decrypted = await decrypt(payload, secret);
  const jsonString = decrypted.toString('utf8');
  return JSON.parse(jsonString);
}