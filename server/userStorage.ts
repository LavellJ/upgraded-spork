// File-backed per-user storage with atomic writes and process locking
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { encrypt, decrypt, encryptJSON, decryptJSON, type EncryptedPayload } from './crypto';
import { JWT_SECRET, ENCRYPTION_ENABLED, RETAIN_DAYS } from './config';

// User document structure
export interface UserDoc {
  email: string;
  role: string;
  roster: {
    learners: Array<{
      id: string;
      name: string;
      avatarId?: string;
      ageBand?: string;
      createdAt: number;
      updatedAt: number;
    }>;
  };
  data: Record<string, any>; // Sync items by ID
  updatedAt: number;
  version: number;
}

// File storage with atomic writes and locking
export class FileUserStorage {
  private readonly dataDir = '.data';
  private readonly lockDir = '.data/.locks';
  private saveQueue = new Map<string, Promise<void>>();

  constructor() {
    // Ensure directories exist
    this.ensureDirectories();
    console.log(`🗄️  FileUserStorage initialized (encryption: ${ENCRYPTION_ENABLED ? 'ON' : 'OFF'}, retention: ${RETAIN_DAYS} days)`);
  }

  private async ensureDirectories(): Promise<void> {
    try {
      if (!existsSync(this.dataDir)) {
        await fs.mkdir(this.dataDir, { recursive: true });
      }
      if (!existsSync(this.lockDir)) {
        await fs.mkdir(this.lockDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create storage directories:', error);
    }
  }

  /**
   * Sanitize email for use as filename
   */
  private sanitizeEmail(email: string): string {
    return email
      .toLowerCase()
      .replace(/[^a-z0-9@.-]/g, '_') // Replace invalid chars
      .replace(/@/g, '_at_')         // Replace @ symbol
      .replace(/\./g, '_dot_');      // Replace dots
  }

  /**
   * Get file path for user document (encrypted version preferred)
   */
  private getUserFilePath(email: string): string {
    const sanitizedEmail = this.sanitizeEmail(email);
    return path.join(this.dataDir, `user_${sanitizedEmail}.enc`);
  }

  /**
   * Get legacy plaintext file path for migration
   */
  private getLegacyUserFilePath(email: string): string {
    const sanitizedEmail = this.sanitizeEmail(email);
    return path.join(this.dataDir, `user_${sanitizedEmail}.json`);
  }

  /**
   * Get lock file path for user
   */
  private getLockFilePath(email: string): string {
    const sanitizedEmail = this.sanitizeEmail(email);
    return path.join(this.lockDir, `user_${sanitizedEmail}.lock`);
  }

  /**
   * Acquire file lock with timeout
   */
  private async acquireLock(email: string, timeoutMs = 5000): Promise<string> {
    const lockFilePath = this.getLockFilePath(email);
    const lockId = randomUUID();
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Try to create lock file exclusively
        await fs.writeFile(lockFilePath, lockId, { flag: 'wx' });
        return lockId; // Successfully acquired lock
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock exists, wait and retry
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        throw error; // Other errors
      }
    }

    throw new Error(`Failed to acquire lock for user ${email} after ${timeoutMs}ms`);
  }

  /**
   * Release file lock
   */
  private async releaseLock(email: string, lockId: string): Promise<void> {
    const lockFilePath = this.getLockFilePath(email);
    try {
      // Verify we own the lock before releasing
      const currentLockId = await fs.readFile(lockFilePath, 'utf8');
      if (currentLockId === lockId) {
        await fs.unlink(lockFilePath);
      }
    } catch (error) {
      // Lock file may already be gone, ignore
      console.warn('Failed to release lock:', error);
    }
  }

  /**
   * Apply data retention policy - compact old events
   */
  private applyRetentionPolicy(doc: UserDoc): UserDoc {
    const cutoffDate = Date.now() - (RETAIN_DAYS * 24 * 60 * 60 * 1000);
    const updatedDoc = { ...doc };
    
    // Process each learner's data
    for (const [learnerId, learnerData] of Object.entries(updatedDoc.data)) {
      const compactedData: Record<string, any> = {};
      const dailySummaries: Record<string, any> = {};
      
      // Group events by date and type
      for (const [itemId, item] of Object.entries(learnerData as Record<string, any>)) {
        if (!item || typeof item !== 'object') {
          compactedData[itemId] = item;
          continue;
        }
        
        // Check if it's an event with timestamp
        if (item.kind === 'event' && item.at && item.at < cutoffDate) {
          const dateKey = new Date(item.at).toISOString().split('T')[0]; // YYYY-MM-DD
          
          if (!dailySummaries[dateKey]) {
            dailySummaries[dateKey] = {
              id: `daily-summary-${dateKey}`,
              kind: 'daily-summary',
              date: dateKey,
              events: 0,
              actions: {},
              at: item.at
            };
          }
          
          dailySummaries[dateKey].events += 1;
          if (item.payload && item.payload.action) {
            const action = item.payload.action;
            dailySummaries[dateKey].actions[action] = (dailySummaries[dateKey].actions[action] || 0) + 1;
          }
        } else {
          // Keep non-event items or recent events
          compactedData[itemId] = item;
        }
      }
      
      // Add daily summaries to compacted data
      Object.assign(compactedData, dailySummaries);
      updatedDoc.data[learnerId] = compactedData;
    }
    
    return updatedDoc;
  }

  /**
   * Load user document from disk or create new one
   */
  async getUserDoc(email: string): Promise<UserDoc> {
    console.debug(`Loading user doc for: ${email}`);
    const filePath = this.getUserFilePath(email);
    const legacyPath = this.getLegacyUserFilePath(email);

    try {
      // Try encrypted file first
      if (ENCRYPTION_ENABLED && existsSync(filePath)) {
        const encryptedData = await fs.readFile(filePath, 'utf8');
        const payload = JSON.parse(encryptedData) as EncryptedPayload;
        const doc = await decryptJSON(payload, JWT_SECRET) as UserDoc;
        
        // Validate structure
        if (!doc.email || !doc.roster || !doc.data) {
          throw new Error('Invalid user document structure');
        }

        return doc;
      }
      
      // Fallback to legacy plaintext file (migration)
      if (existsSync(legacyPath)) {
        console.log(`Migrating plaintext file for ${email} to encrypted storage`);
        const data = await fs.readFile(legacyPath, 'utf8');
        const doc = JSON.parse(data) as UserDoc;
        
        // Validate structure
        if (!doc.email || !doc.roster || !doc.data) {
          throw new Error('Invalid user document structure');
        }

        // Save as encrypted and remove plaintext
        await this.saveUserDoc(email, doc);
        try {
          await fs.unlink(legacyPath);
          console.log(`✅ Migrated ${email} to encrypted storage`);
        } catch (err) {
          console.warn(`Failed to remove legacy file for ${email}:`, err);
        }
        
        return doc;
      }
      
      throw new Error('File not found');
    } catch (error: any) {
      if (error.message === 'File not found' || error.code === 'ENOENT') {
        // File doesn't exist, create new user doc
        const newDoc: UserDoc = {
          email,
          role: 'guide', // Default role
          roster: { learners: [] },
          data: {},
          updatedAt: Date.now(),
          version: 1
        };
        
        // Save the new document
        await this.saveUserDoc(email, newDoc);
        return newDoc;
      }
      
      console.error(`Failed to load user doc for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Save user document to disk atomically with locking
   */
  async saveUserDoc(email: string, doc: UserDoc): Promise<void> {
    // Ensure only one save operation per user at a time
    const existingPromise = this.saveQueue.get(email);
    if (existingPromise) {
      await existingPromise;
    }

    const savePromise = this.doSaveUserDoc(email, doc);
    this.saveQueue.set(email, savePromise);

    try {
      await savePromise;
    } finally {
      this.saveQueue.delete(email);
    }
  }

  /**
   * Internal save implementation with atomic writes and encryption
   */
  private async doSaveUserDoc(email: string, doc: UserDoc): Promise<void> {
    let lockId: string | null = null;

    try {
      // Acquire lock
      lockId = await this.acquireLock(email);

      const filePath = this.getUserFilePath(email);
      const tempFilePath = `${filePath}.tmp.${Date.now()}`;

      // Update metadata
      doc.updatedAt = Date.now();
      doc.version = (doc.version || 0) + 1;
      doc.email = email; // Ensure email is set
      
      // Apply retention policy before saving
      const retainedDoc = this.applyRetentionPolicy(doc);

      if (ENCRYPTION_ENABLED) {
        // Encrypt the document
        const encryptedPayload = await encryptJSON(retainedDoc, JWT_SECRET);
        
        // Write encrypted data to temporary file
        await fs.writeFile(tempFilePath, JSON.stringify(encryptedPayload), 'utf8');
        console.debug(`Wrote encrypted temp file: ${tempFilePath}`);
      } else {
        // Write plaintext (for testing/debugging)
        await fs.writeFile(tempFilePath, JSON.stringify(retainedDoc, null, 2), 'utf8');
        console.debug(`Wrote plaintext temp file: ${tempFilePath}`);
      }

      // Atomic rename to replace existing file
      await fs.rename(tempFilePath, filePath);
      console.log(`✅ Saved user doc for ${email} (version ${retainedDoc.version}) to ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to save user doc for ${email}:`, error);
      throw error;
    } finally {
      // Always release lock
      if (lockId) {
        await this.releaseLock(email, lockId);
      }
    }
  }

  /**
   * List all user emails
   */
  async listUsers(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      const userFiles = files.filter(file => 
        file.startsWith('user_') && (file.endsWith('.json') || file.endsWith('.enc'))
      );
      
      return userFiles.map(file => {
        // Reverse the sanitization to get original email
        const sanitized = file
          .replace('user_', '')
          .replace('.json', '')
          .replace('.enc', '');
        return sanitized
          .replace(/_at_/g, '@')
          .replace(/_dot_/g, '.')
          .replace(/_/g, ''); // This is imperfect but works for most cases
      });
    } catch (error) {
      console.error('Failed to list users:', error);
      return [];
    }
  }

  /**
   * Get storage stats
   */
  async getStats(): Promise<{ userCount: number; totalSize: number; encrypted: boolean; retentionDays: number }> {
    try {
      const files = await fs.readdir(this.dataDir);
      const userFiles = files.filter(file => 
        file.startsWith('user_') && (file.endsWith('.json') || file.endsWith('.enc'))
      );
      
      let totalSize = 0;
      for (const file of userFiles) {
        const filePath = path.join(this.dataDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return {
        userCount: userFiles.length,
        totalSize,
        encrypted: ENCRYPTION_ENABLED,
        retentionDays: RETAIN_DAYS
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { userCount: 0, totalSize: 0, encrypted: ENCRYPTION_ENABLED, retentionDays: RETAIN_DAYS };
    }
  }

  /**
   * Run retention compaction on all users
   */
  async runRetentionCompaction(): Promise<{ processed: number; errors: number }> {
    console.log(`🗂️  Starting retention compaction (${RETAIN_DAYS} day retention)`);
    
    const users = await this.listUsers();
    let processed = 0;
    let errors = 0;
    
    for (const email of users) {
      try {
        const doc = await this.getUserDoc(email);
        // Save will automatically apply retention policy
        await this.saveUserDoc(email, doc);
        processed++;
        console.debug(`✅ Compacted data for ${email}`);
      } catch (error) {
        errors++;
        console.error(`❌ Failed to compact data for ${email}:`, error);
      }
    }
    
    console.log(`🗂️  Retention compaction complete: ${processed} processed, ${errors} errors`);
    return { processed, errors };
  }
}

// Global instance
export const userStorage = new FileUserStorage();