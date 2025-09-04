// Scheduled tasks using node-cron
import cron from 'node-cron';
import { runBackupRoutine } from './backup';
import { dbUserStorage } from './dbStorage';
import { statements } from './db';

/**
 * Initialize all scheduled tasks
 */
export function initializeCronJobs(): void {
  console.log('⏰ Initializing scheduled tasks...');
  
  // Daily backup at 02:30 UTC
  cron.schedule('30 2 * * *', async () => {
    console.log('🔄 Running scheduled backup job...');
    try {
      await runBackupRoutine();
      console.log('✅ Scheduled backup completed');
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error);
    }
  }, {
    name: 'daily-backup',
    timezone: 'UTC'
  });
  
  // Daily retention compaction at 03:00 UTC
  cron.schedule('0 3 * * *', async () => {
    console.log('🔄 Running scheduled retention compaction...');
    try {
      // Placeholder for retention logic - would run compaction on buckets
      const result = { usersProcessed: 0, bucketsCompacted: 0, eventsCompacted: 0, sizeReduction: 0 };
      
      // Audit log the retention run
      statements.insertAuditLog.run(
        Date.now(), 
        'system', 
        'retention_scheduled', 
        JSON.stringify({
          usersProcessed: result.usersProcessed,
          bucketsCompacted: result.bucketsCompacted,
          eventsCompacted: result.eventsCompacted,
          sizeReduction: result.sizeReduction
        })
      );
      
      console.log(`✅ Scheduled retention completed: ${result.usersProcessed} users, ${result.eventsCompacted} events compacted`);
    } catch (error) {
      console.error('❌ Scheduled retention failed:', error);
      
      // Audit log retention failure
      statements.insertAuditLog.run(
        Date.now(), 
        'system', 
        'retention_scheduled_failed', 
        JSON.stringify({
          error: error.message
        })
      );
    }
  }, {
    name: 'daily-retention',
    timezone: 'UTC'
  });
  
  // Weekly cleanup of audit logs (keep last 30 days)
  cron.schedule('0 4 * * 0', async () => {
    console.log('🔄 Running weekly audit log cleanup...');
    try {
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      // Use the imported statements object which has the database connection
      const db = (statements as any).db || statements;
      if (db && db.prepare) {
        const result = db.prepare(`
          DELETE FROM audit_log 
          WHERE timestamp < ?
        `).run(cutoffTime);
        
        console.log(`✅ Audit log cleanup completed: ${result.changes} old entries removed`);
        
        // Log the cleanup
        statements.insertAuditLog.run(
          Date.now(), 
          'system', 
          'audit_cleanup', 
          JSON.stringify({
            entriesRemoved: result.changes,
            retentionDays: 30
          })
        );
      } else {
        console.log('⚠️  Database not available for audit cleanup');
      }
      
    } catch (error) {
      console.error('❌ Audit log cleanup failed:', error);
    }
  }, {
    name: 'weekly-audit-cleanup',
    timezone: 'UTC'
  });
  
  console.log('✅ Scheduled tasks initialized:');
  console.log('  • Daily backup: 02:30 UTC');
  console.log('  • Daily retention: 03:00 UTC');
  console.log('  • Weekly audit cleanup: 04:00 UTC Sunday');
}

/**
 * Get status of all cron jobs
 */
export function getCronJobStatus(): Array<{ name: string; running: boolean; nextExecution: string | null }> {
  const tasks = cron.getTasks();
  
  return Array.from(tasks.entries()).map(([name, task]) => ({
    name,
    running: task.running || false,
    nextExecution: task.nextDate ? task.nextDate().toISOString() : null
  }));
}

/**
 * Start all cron jobs
 */
export function startCronJobs(): void {
  const tasks = cron.getTasks();
  
  tasks.forEach((task, name) => {
    if (!task.running) {
      task.start();
      console.log(`▶️  Started cron job: ${name}`);
    }
  });
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs(): void {
  const tasks = cron.getTasks();
  
  tasks.forEach((task, name) => {
    if (task.running) {
      task.stop();
      console.log(`⏸️  Stopped cron job: ${name}`);
    }
  });
}

/**
 * Destroy all cron jobs (cleanup on shutdown)
 */
export function destroyCronJobs(): void {
  const tasks = cron.getTasks();
  
  tasks.forEach((task, name) => {
    task.destroy();
    console.log(`💥 Destroyed cron job: ${name}`);
  });
}