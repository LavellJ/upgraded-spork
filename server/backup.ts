// Database backup system with compression and retention
import fs from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { statements } from './db';

const BACKUP_DIR = '.backups';
const BACKUP_RETENTION_DAYS = 14;
const DB_PATH = 'qi.db';

/**
 * Ensure backup directory exists
 */
function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Generate backup filename with timestamp
 */
function getBackupFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  return `qi-${timestamp}.sqlite.gz`;
}

/**
 * Create compressed backup of the database
 */
export async function backupDatabase(): Promise<{ filename: string; size: number; created: string }> {
  try {
    ensureBackupDir();
    
    // Check if source database exists
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Database file not found: ${DB_PATH}`);
    }
    
    const backupFilename = getBackupFilename();
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    
    // Skip if backup already exists for today
    if (fs.existsSync(backupPath)) {
      console.log(`📦 Backup already exists for today: ${backupFilename}`);
      const stats = fs.statSync(backupPath);
      return {
        filename: backupFilename,
        size: stats.size,
        created: stats.birthtime.toISOString()
      };
    }
    
    console.log(`📦 Creating database backup: ${backupFilename}`);
    
    // Create compressed backup using streams
    const sourceStream = createReadStream(DB_PATH);
    const gzipStream = createGzip({ level: 9 }); // Maximum compression
    const destStream = createWriteStream(backupPath);
    
    await pipeline(sourceStream, gzipStream, destStream);
    
    // Get backup file stats
    const stats = fs.statSync(backupPath);
    const sourceStats = fs.statSync(DB_PATH);
    
    console.log(`✅ Backup created: ${backupFilename} (${Math.round(stats.size / 1024)}KB, compressed from ${Math.round(sourceStats.size / 1024)}KB)`);
    
    // Audit log backup creation
    statements.insertAuditLog.run(
      Date.now(), 
      'system', 
      'backup_created', 
      JSON.stringify({
        filename: backupFilename,
        originalSize: sourceStats.size,
        compressedSize: stats.size,
        compressionRatio: Math.round((1 - stats.size / sourceStats.size) * 100)
      })
    );
    
    return {
      filename: backupFilename,
      size: stats.size,
      created: stats.birthtime.toISOString()
    };
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    
    // Audit log backup failure
    statements.insertAuditLog.run(
      Date.now(), 
      'system', 
      'backup_failed', 
      JSON.stringify({
        error: error.message
      })
    );
    
    throw error;
  }
}

/**
 * Clean up old backups beyond retention period
 */
export async function pruneOldBackups(): Promise<{ deleted: string[]; kept: string[] }> {
  try {
    ensureBackupDir();
    
    // Get all backup files
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('qi-') && file.endsWith('.sqlite.gz'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stats: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stats.birthtime.getTime() - a.stats.birthtime.getTime()); // Newest first
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);
    
    const toDelete = files.filter(file => file.stats.birthtime < cutoffDate);
    const toKeep = files.filter(file => file.stats.birthtime >= cutoffDate);
    
    // Delete old backups
    const deleted: string[] = [];
    for (const file of toDelete) {
      try {
        fs.unlinkSync(file.path);
        deleted.push(file.name);
        console.log(`🗑️  Deleted old backup: ${file.name}`);
      } catch (deleteError) {
        console.error(`❌ Failed to delete backup ${file.name}:`, deleteError);
      }
    }
    
    if (deleted.length > 0) {
      // Audit log backup pruning
      statements.insertAuditLog.run(
        Date.now(), 
        'system', 
        'backup_pruned', 
        JSON.stringify({
          deleted: deleted,
          retentionDays: BACKUP_RETENTION_DAYS,
          totalKept: toKeep.length
        })
      );
    }
    
    console.log(`📦 Backup cleanup: ${deleted.length} deleted, ${toKeep.length} kept (${BACKUP_RETENTION_DAYS}d retention)`);
    
    return {
      deleted: deleted,
      kept: toKeep.map(f => f.name)
    };
    
  } catch (error) {
    console.error('❌ Backup pruning failed:', error);
    
    // Audit log pruning failure
    statements.insertAuditLog.run(
      Date.now(), 
      'system', 
      'backup_pruning_failed', 
      JSON.stringify({
        error: error.message
      })
    );
    
    throw error;
  }
}

/**
 * List all available backups
 */
export function listBackups(): Array<{ filename: string; size: number; created: string; age: string }> {
  try {
    ensureBackupDir();
    
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('qi-') && file.endsWith('.sqlite.gz'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        const ageMs = Date.now() - stats.birthtime.getTime();
        const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
        
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime.toISOString(),
          age: ageDays === 0 ? 'Today' : ageDays === 1 ? '1 day ago' : `${ageDays} days ago`
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()); // Newest first
    
    return files;
    
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    return [];
  }
}

/**
 * Get backup statistics
 */
export function getBackupStats(): { total: number; totalSize: number; oldestDate: string | null; newestDate: string | null } {
  try {
    const backups = listBackups();
    
    if (backups.length === 0) {
      return { total: 0, totalSize: 0, oldestDate: null, newestDate: null };
    }
    
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    
    return {
      total: backups.length,
      totalSize,
      oldestDate: backups[backups.length - 1].created,
      newestDate: backups[0].created
    };
    
  } catch (error) {
    console.error('❌ Failed to get backup stats:', error);
    return { total: 0, totalSize: 0, oldestDate: null, newestDate: null };
  }
}

/**
 * Full backup routine (backup + prune)
 */
export async function runBackupRoutine(): Promise<{ backup: any; pruning: any }> {
  console.log('🔄 Starting scheduled backup routine...');
  
  try {
    // Create backup
    const backup = await backupDatabase();
    
    // Prune old backups
    const pruning = await pruneOldBackups();
    
    console.log('✅ Backup routine completed successfully');
    
    return { backup, pruning };
    
  } catch (error) {
    console.error('❌ Backup routine failed:', error);
    throw error;
  }
}