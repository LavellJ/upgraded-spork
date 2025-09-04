#!/usr/bin/env tsx
// Migration script from file-based storage to database
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { dbUserStorage } from './dbStorage';
import { decryptJSON, type EncryptedPayload } from './crypto';
import { statements } from './db';

const DATA_DIR = '.data';
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';

interface LegacyUserDoc {
  email: string;
  role?: string;
  roster?: any[];
  learners?: Record<string, {
    events?: any;
    model?: any;
    journal?: any;
    assignments?: any;
    reflections?: any;
  }>;
}

async function migrateSingleUser(email: string): Promise<void> {
  console.log(`📦 Migrating user: ${email}`);
  
  const userFilePath = join(DATA_DIR, `${email}.enc`);
  const userJsonPath = join(DATA_DIR, `${email}.json`);
  
  let userData: LegacyUserDoc | null = null;
  
  // Try encrypted file first
  if (existsSync(userFilePath)) {
    try {
      const encryptedData = readFileSync(userFilePath, 'utf8');
      const payload: EncryptedPayload = JSON.parse(encryptedData);
      userData = await decryptJSON(payload, JWT_SECRET);
      console.log(`  ✓ Loaded encrypted data for ${email}`);
    } catch (error) {
      console.error(`  ❌ Failed to decrypt ${email}.enc:`, error);
    }
  }
  
  // Fallback to JSON file
  if (!userData && existsSync(userJsonPath)) {
    try {
      const jsonData = readFileSync(userJsonPath, 'utf8');
      userData = JSON.parse(jsonData);
      console.log(`  ✓ Loaded JSON data for ${email}`);
    } catch (error) {
      console.error(`  ❌ Failed to parse ${email}.json:`, error);
    }
  }
  
  if (!userData) {
    console.error(`  ❌ No valid data found for ${email}`);
    return;
  }

  try {
    // Migrate roster
    if (userData.roster) {
      // Handle both old array format and new object format
      const rosterData = Array.isArray(userData.roster) 
        ? { learners: userData.roster }
        : userData.roster;
      
      await dbUserStorage.updateRoster(email, rosterData);
      console.log(`  ✓ Migrated roster (${rosterData.learners?.length || 0} learners)`);
    }

    // Migrate learner buckets
    if (userData.learners) {
      let bucketCount = 0;
      for (const [learnerId, buckets] of Object.entries(userData.learners)) {
        for (const [bucketType, bucketData] of Object.entries(buckets)) {
          if (bucketData && ['events', 'model', 'journal', 'assignments', 'reflections'].includes(bucketType)) {
            await dbUserStorage.putBucket(email, learnerId, bucketType as any, bucketData);
            bucketCount++;
          }
        }
      }
      console.log(`  ✓ Migrated ${bucketCount} buckets for ${Object.keys(userData.learners).length} learners`);
    }

    // Log migration completion
    statements.insertAuditLog.run(Date.now(), email, 'migration_complete', JSON.stringify({
      hasRoster: !!(userData.roster),
      learnerCount: userData.learners ? Object.keys(userData.learners).length : 0,
      bucketCount: userData.learners ? Object.values(userData.learners).reduce((acc, learner) => acc + Object.keys(learner).length, 0) : 0
    }));

    console.log(`  ✅ Migration completed for ${email}`);
  } catch (error) {
    console.error(`  ❌ Migration failed for ${email}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting migration from file storage to database...');
  
  if (!existsSync(DATA_DIR)) {
    console.log('📁 No .data directory found, nothing to migrate');
    return;
  }

  // Find all user files
  const files = readdirSync(DATA_DIR);
  const userFiles = files.filter(f => f.endsWith('.enc') || f.endsWith('.json'));
  const emails = [...new Set(userFiles.map(f => f.replace(/\.(enc|json)$/, '')))];
  
  if (emails.length === 0) {
    console.log('📁 No user files found, nothing to migrate');
    return;
  }

  console.log(`📋 Found ${emails.length} users to migrate: ${emails.join(', ')}`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const email of emails) {
    try {
      await migrateSingleUser(email);
      successCount++;
    } catch (error) {
      console.error(`💥 Failed to migrate ${email}:`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`  📋 Total: ${emails.length}`);
  
  if (successCount > 0) {
    console.log('\n🗄️  Database now contains migrated user data');
    console.log('💡 You can now switch to database storage in your routes');
  }
}

// Run migration if called directly
const isMainModule = process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js');
if (isMainModule) {
  main().catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}