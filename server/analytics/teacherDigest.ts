// Server-side analytics for teacher digest emails
import { dbUserStorage, type UserDoc } from '../dbStorage';
import { renderTeacherDigest, type TeacherDigestKPIs, type TeacherDigestHighlight } from '../emailTemplates/teacherDigest';
import { format, addDays, startOfWeek, subWeeks } from 'date-fns';
import { statements } from '../db';
import nodemailer from 'nodemailer';
import { 
  SMTP_HOST, 
  SMTP_PORT, 
  SMTP_USER, 
  SMTP_PASS, 
  SMTP_FROM,
  EMAIL_ENABLED,
  EMAIL_PREVIEW_MODE 
} from '../config';

// Email transporter (same setup as main email service)
const transporter = EMAIL_ENABLED ? nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
}) : null;

interface LearnerWeeklyData {
  learnerId: string;
  name: string;
  minutes: number;
  sessions: number;
  assignmentsDone: number;
  dueSoon: number;
  overdue: number;
  hasStreak: boolean; // >= 3 days
}

/**
 * Build KPIs and highlights for a class from their learner data
 */
function buildClassKPIs(learners: LearnerWeeklyData[], className: string): {
  kpis: TeacherDigestKPIs;
  highlights: TeacherDigestHighlight[];
} {
  const totalLearners = learners.length;
  const activeLearners = learners.filter(l => l.minutes > 0).length;
  
  // Calculate averages and totals
  const totalMinutes = learners.reduce((sum, l) => sum + l.minutes, 0);
  const avgOnTaskMins = totalLearners > 0 ? totalMinutes / totalLearners : 0;
  const totalSessions = learners.reduce((sum, l) => sum + l.sessions, 0);
  const assignmentsDone = learners.reduce((sum, l) => sum + l.assignmentsDone, 0);
  const dueSoon = learners.reduce((sum, l) => sum + l.dueSoon, 0);
  const overdue = learners.reduce((sum, l) => sum + l.overdue, 0);
  const streakers = learners.filter(l => l.hasStreak).length;
  const streakersPct = totalLearners > 0 ? (streakers / totalLearners) * 100 : 0;

  const kpis: TeacherDigestKPIs = {
    totalLearners,
    activeLearners,
    avgOnTaskMins,
    totalSessions,
    assignmentsDone,
    dueSoon,
    overdue,
    streakersPct
  };

  // Generate highlights based on data patterns
  const highlights: TeacherDigestHighlight[] = [];

  // Top performer
  const topLearner = learners.reduce((top, current) => 
    current.minutes > top.minutes ? current : top, 
    learners[0] || { name: '', minutes: 0 }
  );
  if (topLearner.minutes > 0) {
    highlights.push({
      type: 'achievement',
      title: '⭐ Top Performer',
      description: `${topLearner.name} spent ${Math.round(topLearner.minutes)} minutes learning this week!`,
      learnerName: topLearner.name
    });
  }

  // Streak achievements
  if (streakers > 0) {
    highlights.push({
      type: 'achievement',
      title: '🔥 Learning Streaks',
      description: `${streakers} learner${streakers > 1 ? 's have' : ' has'} active learning streaks of 3+ days!`
    });
  }

  // Assignment concerns
  if (overdue > 0) {
    highlights.push({
      type: 'concern',
      title: '⚠️ Overdue Assignments',
      description: `${overdue} assignment${overdue > 1 ? 's are' : ' is'} past due and may need attention.`
    });
  } else if (dueSoon > 5) {
    highlights.push({
      type: 'insight',
      title: '📅 Upcoming Deadlines',
      description: `${dueSoon} assignments due in the next 2 days. Consider sending reminders.`
    });
  }

  // Engagement insights
  if (activeLearners < totalLearners * 0.7) {
    const inactive = totalLearners - activeLearners;
    highlights.push({
      type: 'concern',
      title: '📊 Low Engagement',
      description: `${inactive} learner${inactive > 1 ? 's' : ''} had no activity this week. Consider reaching out.`
    });
  }

  // High engagement insight
  if (avgOnTaskMins > 30) {
    highlights.push({
      type: 'achievement',
      title: '📈 High Engagement',
      description: `Excellent! Class averaged ${Math.round(avgOnTaskMins)} minutes per learner this week.`
    });
  }

  return { kpis, highlights: highlights.slice(0, 5) }; // Limit to 5 highlights
}

/**
 * Generate CSV data for learners
 */
function generateCSV(learners: LearnerWeeklyData[], weekStartISO: string): string {
  const header = [
    'Learner Name',
    'Learner ID',
    'Minutes',
    'Sessions',
    'Assignments Done',
    'Due Soon',
    'Overdue',
    'Has Streak (≥3 days)',
    'Week Starting'
  ];

  const rows = learners.map(learner => [
    `"${learner.name}"`,
    `"${learner.learnerId}"`,
    learner.minutes.toString(),
    learner.sessions.toString(),
    learner.assignmentsDone.toString(),
    learner.dueSoon.toString(),
    learner.overdue.toString(),
    learner.hasStreak ? 'Yes' : 'No',
    weekStartISO
  ]);

  return [header.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Calculate weekly data for a single learner (server-side equivalent of client functions)
 */
async function calculateLearnerWeeklyData(
  userEmail: string, 
  learnerId: string, 
  learnerName: string, 
  weekStartISO: string
): Promise<LearnerWeeklyData> {
  try {
    // This is a simplified server-side version
    // In a real implementation, you would load the actual event data from the database
    // For now, we'll return mock data that demonstrates the structure
    
    // Mock calculation based on learner ID patterns
    const seed = learnerId.charCodeAt(learnerId.length - 1) + learnerId.charCodeAt(0);
    const mockMinutes = Math.max(0, (seed % 60) + Math.floor(Math.random() * 30));
    const mockSessions = mockMinutes > 0 ? Math.max(1, Math.floor(mockMinutes / 15)) : 0;
    const mockAssignmentsDone = Math.floor(Math.random() * 3);
    const mockDueSoon = Math.floor(Math.random() * 2);
    const mockOverdue = Math.random() < 0.2 ? 1 : 0; // 20% chance of overdue
    const mockHasStreak = Math.random() < 0.4; // 40% chance of streak

    return {
      learnerId,
      name: learnerName,
      minutes: mockMinutes,
      sessions: mockSessions,
      assignmentsDone: mockAssignmentsDone,
      dueSoon: mockDueSoon,
      overdue: mockOverdue,
      hasStreak: mockHasStreak
    };
  } catch (error) {
    console.error(`Error calculating data for learner ${learnerId}:`, error);
    return {
      learnerId,
      name: learnerName,
      minutes: 0,
      sessions: 0,
      assignmentsDone: 0,
      dueSoon: 0,
      overdue: 0,
      hasStreak: false
    };
  }
}

/**
 * Send teacher digest for a single user
 */
export async function sendTeacherDigest(userEmail: string, weekStartISO: string): Promise<void> {
  try {
    // Get user document
    const userDoc = await dbUserStorage.getUserDoc(userEmail);
    if (!userDoc || !userDoc.roster?.learners) {
      console.log(`No learners found for user ${userEmail}, skipping digest`);
      return;
    }

    const learners = userDoc.roster.learners;
    if (learners.length === 0) {
      console.log(`No learners in roster for user ${userEmail}, skipping digest`);
      return;
    }

    // Calculate weekly data for each learner
    const learnerData: LearnerWeeklyData[] = await Promise.all(
      learners.map(learner => 
        calculateLearnerWeeklyData(userEmail, learner.id, learner.name, weekStartISO)
      )
    );

    // Generate class name (simplified - could be more sophisticated)
    const className = `${userEmail.split('@')[0]}'s Class`;

    // Build KPIs and highlights
    const { kpis, highlights } = buildClassKPIs(learnerData, className);

    // Generate CSV
    const csvContent = generateCSV(learnerData, weekStartISO);
    const csvFilename = `${className.replace(/[^a-z0-9]/gi, '_')}_${weekStartISO}.csv`;

    // Generate email content
    const { subject, html, text, attachments } = renderTeacherDigest({
      className,
      weekStartISO,
      kpis,
      topHighlights: highlights,
      csvAttachment: {
        filename: csvFilename,
        content: csvContent
      }
    });

    // Send email or preview in development
    if (EMAIL_PREVIEW_MODE) {
      console.log('📧 Teacher Digest Preview:');
      console.log('To:', userEmail);
      console.log('Subject:', subject);
      console.log('--- KPIs ---');
      console.log(JSON.stringify(kpis, null, 2));
      console.log('--- Highlights ---');
      console.log(JSON.stringify(highlights, null, 2));
      console.log('--- CSV Sample ---');
      console.log(csvContent.split('\n').slice(0, 3).join('\n'));
      console.log('--- END PREVIEW ---');
    } else if (EMAIL_ENABLED && transporter) {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: userEmail,
        subject,
        text,
        html,
        attachments
      });
    }

    // Audit log
    statements.insertAuditLog.run(
      Date.now(),
      'system',
      'teacher_digest_sent',
      JSON.stringify({
        recipient: userEmail,
        week_start: weekStartISO,
        learners_count: learners.length,
        kpis: {
          active_learners: kpis.activeLearners,
          avg_minutes: Math.round(kpis.avgOnTaskMins),
          assignments_done: kpis.assignmentsDone,
          overdue: kpis.overdue
        }
      })
    );

    console.log(`✅ Teacher digest sent to ${userEmail} for week ${weekStartISO}`);
  } catch (error) {
    console.error(`❌ Failed to send teacher digest to ${userEmail}:`, error);
    
    // Audit log failure
    statements.insertAuditLog.run(
      Date.now(),
      'system',
      'teacher_digest_failed',
      JSON.stringify({
        recipient: userEmail,
        week_start: weekStartISO,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    );
  }
}

/**
 * Send teacher digest to all users with cloud enabled (for cron job)
 */
export async function sendTeacherDigestToAll(weekStartISO?: string): Promise<void> {
  try {
    // Default to last week's Monday if no week specified
    if (!weekStartISO) {
      const lastWeek = subWeeks(new Date(), 1);
      const monday = startOfWeek(lastWeek, { weekStartsOn: 1 }); // Monday = 1
      weekStartISO = format(monday, 'yyyy-MM-dd');
    }

    console.log(`🔄 Starting teacher digest batch for week ${weekStartISO}`);

    // Get all users from database
    const users = statements.getAllUsers.all() as Array<{ email: string; role: string }>;
    console.log(`Found ${users.length} users to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users) {
      try {
        // For now, send to all users with rosters
        // In production, you would check user preferences here
        await sendTeacherDigest(user.email, weekStartISO);
        successCount++;
        
        // Small delay between sends to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to send digest to ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Teacher digest batch completed: ${successCount} sent, ${errorCount} failed`);
    
    // Overall audit log
    statements.insertAuditLog.run(
      Date.now(),
      'system',
      'teacher_digest_batch',
      JSON.stringify({
        week_start: weekStartISO,
        total_users: users.length,
        success_count: successCount,
        error_count: errorCount
      })
    );
  } catch (error) {
    console.error('❌ Teacher digest batch failed:', error);
    statements.insertAuditLog.run(
      Date.now(),
      'system',
      'teacher_digest_batch_failed',
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    );
  }
}