// File-backed per-user storage with atomic writes and process locking
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// User document structure
export interface UserDoc {
  email: string;
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
    console.log('🗄️  FileUserStorage initialized');
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
   * Get file path for user document
   */
  private getUserFilePath(email: string): string {
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
   * Load user document from disk or create new one
   */
  async getUserDoc(email: string): Promise<UserDoc> {
    console.debug(`Loading user doc for: ${email}`);
    const filePath = this.getUserFilePath(email);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const doc = JSON.parse(data) as UserDoc;
      
      // Validate structure
      if (!doc.email || !doc.roster || !doc.data) {
        throw new Error('Invalid user document structure');
      }

      return doc;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create new user doc
        const newDoc: UserDoc = {
          email,
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
   * Internal save implementation with atomic writes
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

      // Write to temporary file first
      await fs.writeFile(tempFilePath, JSON.stringify(doc, null, 2), 'utf8');
      console.debug(`Wrote temp file: ${tempFilePath}`);

      // Atomic rename to replace existing file
      await fs.rename(tempFilePath, filePath);
      console.log(`✅ Saved user doc for ${email} (version ${doc.version}) to ${filePath}`);
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
      const userFiles = files.filter(file => file.startsWith('user_') && file.endsWith('.json'));
      
      return userFiles.map(file => {
        // Reverse the sanitization to get original email
        const sanitized = file.replace('user_', '').replace('.json', '');
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
  async getStats(): Promise<{ userCount: number; totalSize: number }> {
    try {
      const files = await fs.readdir(this.dataDir);
      const userFiles = files.filter(file => file.startsWith('user_') && file.endsWith('.json'));
      
      let totalSize = 0;
      for (const file of userFiles) {
        const filePath = path.join(this.dataDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return {
        userCount: userFiles.length,
        totalSize
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { userCount: 0, totalSize: 0 };
    }
  }
}

// Global instance
export const userStorage = new FileUserStorage();