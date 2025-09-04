// Database-backed user storage with encrypted buckets
import { statements, db, type BucketType, type UserDocRow, type UserRow } from './db';
import { encryptJSON, decryptJSON, type EncryptedPayload } from './crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';

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
  data: Record<string, any>; // Learner sync data by learner ID
  updatedAt: number;
  version: number;
}

export class DatabaseUserStorage {
  constructor() {
    console.log('🗄️  Database-backed user storage initialized');
  }

  /**
   * Ensure user exists in database
   */
  private async ensureUser(email: string): Promise<void> {
    const existing = statements.getUser.get(email) as UserRow | undefined;
    if (!existing) {
      const now = Date.now();
      statements.insertUser.run(email, 'guide', now, now);
      
      // Log user creation
      statements.insertAuditLog.run(Date.now(), email, 'user_created', null);
    }
  }

  /**
   * Get encrypted bucket data for a specific learner
   */
  async getBucket(email: string, learnerId: string, bucket: BucketType): Promise<any | null> {
    try {
      const row = statements.getUserDoc.get(email, learnerId, bucket) as UserDocRow | undefined;
      if (!row) {
        return null;
      }

      // Decrypt the ciphertext
      const payload: EncryptedPayload = JSON.parse(row.ciphertext.toString('utf8'));
      const decrypted = await decryptJSON(payload, JWT_SECRET);
      return decrypted;
    } catch (error) {
      console.error(`Failed to get bucket ${bucket} for ${email}/${learnerId}:`, error);
      return null;
    }
  }

  /**
   * Store encrypted bucket data for a specific learner
   */
  async putBucket(email: string, learnerId: string, bucket: BucketType, data: any): Promise<void> {
    try {
      await this.ensureUser(email);

      // Encrypt the data
      const encrypted = await encryptJSON(data, JWT_SECRET);
      const ciphertext = Buffer.from(JSON.stringify(encrypted), 'utf8');
      
      const now = Date.now();
      const version = now; // Use timestamp as version for now
      
      statements.upsertUserDoc.run(email, learnerId, bucket, version, ciphertext, now);
      
      // Log bucket update
      statements.insertAuditLog.run(now, email, 'bucket_updated', JSON.stringify({
        learnerId,
        bucket,
        version
      }));
    } catch (error) {
      console.error(`Failed to put bucket ${bucket} for ${email}/${learnerId}:`, error);
      throw error;
    }
  }

  /**
   * List all learner IDs for a user
   */
  async listLearners(email: string): Promise<string[]> {
    try {
      const rows = statements.listLearners.all(email) as { learnerId: string }[];
      return rows.map(row => row.learnerId);
    } catch (error) {
      console.error(`Failed to list learners for ${email}:`, error);
      return [];
    }
  }

  /**
   * Get complete user document with roster and all learner data
   */
  async getUserDoc(email: string): Promise<UserDoc> {
    try {
      await this.ensureUser(email);
      
      const user = statements.getUser.get(email) as UserRow;
      
      // Get roster (stored as special bucket with learnerId = 'roster')
      const rosterData = await this.getBucket(email, 'roster', 'roster');
      const roster = rosterData || { learners: [] };
      
      // Get all learners and their data
      const learners = await this.listLearners(email);
      const data: Record<string, any> = {};
      
      for (const learnerId of learners) {
        if (learnerId === 'roster') continue; // Skip the roster special case
        
        // Combine all bucket types into a flat data structure for this learner
        const learnerData: Record<string, any> = {};
        
        for (const bucketType of ['events', 'model', 'journal', 'assignments', 'reflections'] as BucketType[]) {
          const bucketData = await this.getBucket(email, learnerId, bucketType);
          if (bucketData !== null) {
            // Merge bucket data into learner data
            Object.assign(learnerData, bucketData);
          }
        }
        
        if (Object.keys(learnerData).length > 0) {
          data[learnerId] = learnerData;
        }
      }

      return {
        email,
        role: user.role,
        roster,
        data,
        updatedAt: Date.now(),
        version: 1
      };
    } catch (error) {
      console.error(`Failed to get user doc for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Update user roster
   */
  async updateRoster(email: string, roster: { learners: any[] }): Promise<void> {
    await this.putBucket(email, 'roster', 'roster', roster);
  }

  /**
   * Save complete user document by distributing data into buckets
   */
  async saveUserDoc(email: string, doc: UserDoc): Promise<void> {
    try {
      await this.ensureUser(email);
      
      // Save roster
      await this.updateRoster(email, doc.roster);
      
      // Save learner data by distributing into appropriate buckets
      for (const [learnerId, learnerData] of Object.entries(doc.data)) {
        // Group data by bucket type based on item kind/type
        const buckets: Record<BucketType, any> = {
          events: {},
          model: {},
          journal: {},
          assignments: {},
          reflections: {}
        };
        
        // Distribute items into appropriate buckets
        for (const [itemId, item] of Object.entries(learnerData)) {
          if (!item || typeof item !== 'object') continue;
          
          const kind = (item as any).kind || 'model';
          let bucketType: BucketType = 'model'; // default
          
          if (kind === 'event' || kind === 'daily-summary') {
            bucketType = 'events';
          } else if (kind === 'journal-entry') {
            bucketType = 'journal';
          } else if (kind === 'assignment') {
            bucketType = 'assignments';
          } else if (kind === 'reflection') {
            bucketType = 'reflections';
          }
          
          buckets[bucketType][itemId] = item;
        }
        
        // Save non-empty buckets
        for (const [bucketType, bucketData] of Object.entries(buckets)) {
          if (Object.keys(bucketData).length > 0) {
            await this.putBucket(email, learnerId, bucketType as BucketType, bucketData);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to save user doc for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Get audit log for user
   */
  async getAuditLog(email: string, limit: number = 100): Promise<any[]> {
    try {
      const rows = statements.getAuditLog.all(email, limit);
      return rows.map(row => ({
        ...row,
        meta: row.meta ? JSON.parse(row.meta) : null
      }));
    } catch (error) {
      console.error(`Failed to get audit log for ${email}:`, error);
      return [];
    }
  }
}

export const dbUserStorage = new DatabaseUserStorage();