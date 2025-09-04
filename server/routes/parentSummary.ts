// Parent summary email routes
import express from 'express';
import { verifyToken } from '../auth';
import { renderParentEmail, type ParentSummaryParams } from '../emailTemplates/parentSummary';
import { logAuditEvent } from '../audit';
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

const router = express.Router();

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

// Authentication middleware for guide/admin only
function requireGuideAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid or missing authentication token' });
  }
  
  if (user.role !== 'guide' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Guide or admin role required' });
  }
  
  // Attach user info to request
  (req as any).user = user;
  next();
}

interface ParentSummaryRequest {
  email: string;
  learnerId: string;
  weekStartISO: string;
}

router.post('/api/report/parent-summary', requireGuideAuth, async (req, res) => {
  try {
    const { email, learnerId, weekStartISO }: ParentSummaryRequest = req.body;
    const userEmail = (req as any).user.email;
    
    // Validate required fields
    if (!email || !learnerId || !weekStartISO) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, learnerId, weekStartISO' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate ISO date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(weekStartISO)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Build parent summary data (this is a simplified version - in real implementation
    // you would load learner data from storage/database)
    const summaryData = await buildParentSummaryData(learnerId, weekStartISO);
    
    if (!summaryData) {
      return res.status(404).json({ error: 'Learner not found or no data available' });
    }
    
    // Generate email content
    const { subject, html, text } = renderParentEmail(summaryData);
    
    // Send email or preview in development
    if (EMAIL_PREVIEW_MODE) {
      console.log('📧 Parent Summary Email Preview:');
      console.log('To:', email);
      console.log('Subject:', subject);
      console.log('--- HTML ---');
      console.log(html);
      console.log('--- TEXT ---');
      console.log(text);
      console.log('--- END PREVIEW ---');
      
      // Audit log in preview mode
      logAuditEvent({
        action: 'parent_summary_sent',
        actor: userEmail,
        details: { 
          parent_email: email,
          learner_id: hashLearnerIdForAudit(learnerId),
          week_start: weekStartISO,
          preview_mode: true
        },
        ip: req.ip
      });
      
      return res.json({ 
        success: true, 
        message: 'Email preview generated (development mode)',
        preview: { subject, html, text }
      });
    }
    
    // Send actual email in production
    if (!EMAIL_ENABLED || !transporter) {
      return res.status(500).json({ error: 'Email service not configured' });
    }
    
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      text,
      html
    });
    
    // Audit log successful send
    logAuditEvent({
      action: 'parent_summary_sent',
      actor: userEmail,
      details: { 
        parent_email: email,
        learner_id: hashLearnerIdForAudit(learnerId),
        week_start: weekStartISO,
        preview_mode: false
      },
      ip: req.ip
    });
    
    res.json({ success: true, message: 'Parent summary email sent successfully' });
    
  } catch (error) {
    console.error('Error sending parent summary email:', error);
    
    // Audit log send error
    logAuditEvent({
      action: 'parent_summary_error',
      actor: (req as any).user?.email || 'unknown',
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        parent_email: req.body.email,
        learner_id: req.body.learnerId ? hashLearnerIdForAudit(req.body.learnerId) : 'unknown'
      },
      ip: req.ip
    });
    
    res.status(500).json({ error: 'Failed to send parent summary email' });
  }
});

/**
 * Build parent summary data from learner's progress
 * This is a simplified version - would integrate with actual data storage
 */
async function buildParentSummaryData(learnerId: string, weekStartISO: string): Promise<ParentSummaryParams | null> {
  try {
    // In a real implementation, you would:
    // 1. Load learner profile from database
    // 2. Load progress events for the week
    // 3. Calculate metrics using existing analytics functions
    // 4. Load assignment data
    // 5. Calculate streak information
    
    // For now, return mock data structure
    const weekStart = new Date(weekStartISO);
    const learnerName = `Learner ${learnerId.slice(-4)}`; // Mock name
    
    // Mock data - replace with real data loading
    const mockData: ParentSummaryParams = {
      learnerName,
      weekStartISO,
      minutes: 45, // Would come from analytics
      sessions: 3, // Would come from session calculation
      streak: { current: 5, best: 12 }, // Would come from streak calculation
      accomplishments: [
        'Completed "Addition with Regrouping"',
        'Finished "Reading Comprehension: Animals"',
        'Mastered "Shapes and Patterns"'
      ], // Would come from lesson completion events
      nextSteps: [
        'Try "Subtraction with Regrouping"',
        'Explore "Writing Stories: Beginning, Middle, End"'
      ], // Would come from assignment system
      optOutLink: undefined // Could be generated with preferences token
    };
    
    return mockData;
    
  } catch (error) {
    console.error('Error building parent summary data:', error);
    return null;
  }
}

/**
 * Hash learner ID for audit trail privacy
 */
function hashLearnerIdForAudit(learnerId: string): string {
  // Simple hash for privacy - in production might want a proper hash function
  const hash = Buffer.from(learnerId).toString('base64').slice(0, 8);
  return `learner_${hash}`;
}

export { router as parentSummaryRouter };