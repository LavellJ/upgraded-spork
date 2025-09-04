// Teacher weekly digest email template
import { format, addDays } from 'date-fns';

export interface TeacherDigestKPIs {
  totalLearners: number;
  activeLearners: number;
  avgOnTaskMins: number;
  totalSessions: number;
  assignmentsDone: number;
  dueSoon: number;
  overdue: number;
  streakersPct: number; // % with streaks >= 3 days
}

export interface TeacherDigestHighlight {
  type: 'achievement' | 'concern' | 'insight';
  title: string;
  description: string;
  learnerName?: string;
}

export interface TeacherDigestParams {
  className: string;
  weekStartISO: string;
  kpis: TeacherDigestKPIs;
  topHighlights: TeacherDigestHighlight[];
  csvAttachment: {
    filename: string;
    content: string; // CSV data as string
  };
}

export function renderTeacherDigest(params: TeacherDigestParams): { 
  subject: string; 
  html: string; 
  text: string;
  attachments: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
} {
  const {
    className,
    weekStartISO,
    kpis,
    topHighlights,
    csvAttachment
  } = params;

  // Format the week range for display
  const weekStart = new Date(weekStartISO);
  const weekEnd = addDays(weekStart, 6);
  
  const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  
  // Helper to format minutes into readable format
  const formatMinutes = (totalMinutes: number): string => {
    if (totalMinutes < 60) {
      return `${totalMinutes.toFixed(1)} minutes`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins < 0.5) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${mins.toFixed(0)}m`;
  };

  const subject = `${className} Weekly Digest - Week of ${format(weekStart, 'MMM d')}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${subject}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: #f8fafc;
          color: #334155;
          line-height: 1.6;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%); 
          padding: 30px; 
          text-align: center; 
          color: white;
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .header .class-name {
          font-size: 18px;
          font-weight: 500;
          margin: 8px 0 0 0;
          opacity: 0.9;
        }
        .content { 
          padding: 30px; 
        }
        .week-info {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          text-align: center;
        }
        .week-info h2 {
          margin: 0 0 10px 0;
          color: #475569;
          font-size: 20px;
        }
        .week-info .date-range {
          color: #64748b;
          font-size: 16px;
        }
        
        /* KPI Cards */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .kpi-card {
          background: #fefefe;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .kpi-card.primary {
          border-color: #1e40af;
          background: #eff6ff;
        }
        .kpi-card.success {
          border-color: #16a34a;
          background: #f0fdf4;
        }
        .kpi-card.warning {
          border-color: #d97706;
          background: #fffbeb;
        }
        .kpi-card.concern {
          border-color: #dc2626;
          background: #fef2f2;
        }
        .kpi-value {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 5px;
        }
        .kpi-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          line-height: 1.4;
        }
        
        /* Highlights Section */
        .section {
          margin: 30px 0;
        }
        .section h3 {
          color: #0f172a;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 15px 0;
        }
        .highlights-list {
          space-y: 15px;
        }
        .highlight {
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid;
        }
        .highlight.achievement {
          background: #f0fdf4;
          border-left-color: #16a34a;
        }
        .highlight.concern {
          background: #fef2f2;
          border-left-color: #dc2626;
        }
        .highlight.insight {
          background: #eff6ff;
          border-left-color: #1e40af;
        }
        .highlight-title {
          font-weight: 600;
          margin-bottom: 5px;
          color: #0f172a;
        }
        .highlight-description {
          font-size: 14px;
          color: #475569;
          margin: 0;
        }
        
        /* CSV Section */
        .csv-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .csv-icon {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin-right: 8px;
          opacity: 0.7;
        }
        
        .footer {
          padding: 30px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
          text-align: center;
        }
        .footer a {
          color: #1e40af;
          text-decoration: none;
        }
        
        /* Print styles */
        @media print {
          body { background: white; }
          .container { box-shadow: none; margin: 0; }
          .header { break-inside: avoid; }
          .section { break-inside: avoid; }
          .footer { break-before: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 LearnOz Weekly Digest</h1>
          <p class="class-name">${className}</p>
        </div>
        
        <div class="content">
          <div class="week-info">
            <h2>Week of ${weekRange}</h2>
            <p class="date-range">Class Learning Summary</p>
          </div>

          <!-- KPI Grid -->
          <div class="kpi-grid">
            <div class="kpi-card primary">
              <div class="kpi-value">${kpis.activeLearners}/${kpis.totalLearners}</div>
              <div class="kpi-label">Active Learners</div>
            </div>
            <div class="kpi-card ${kpis.avgOnTaskMins >= 20 ? 'success' : kpis.avgOnTaskMins >= 10 ? 'warning' : 'concern'}">
              <div class="kpi-value">${formatMinutes(kpis.avgOnTaskMins)}</div>
              <div class="kpi-label">Avg On-Task Time</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">${kpis.totalSessions}</div>
              <div class="kpi-label">Total Sessions</div>
            </div>
            <div class="kpi-card ${kpis.assignmentsDone >= 5 ? 'success' : 'primary'}">
              <div class="kpi-value">${kpis.assignmentsDone}</div>
              <div class="kpi-label">Assignments Done</div>
            </div>
            <div class="kpi-card ${kpis.overdue > 0 ? 'concern' : kpis.dueSoon > 3 ? 'warning' : 'success'}">
              <div class="kpi-value">${kpis.dueSoon}</div>
              <div class="kpi-label">Due Soon</div>
            </div>
            <div class="kpi-card ${kpis.overdue > 0 ? 'concern' : 'success'}">
              <div class="kpi-value">${kpis.overdue}</div>
              <div class="kpi-label">Overdue</div>
            </div>
            <div class="kpi-card ${kpis.streakersPct >= 50 ? 'success' : kpis.streakersPct >= 25 ? 'warning' : 'concern'}">
              <div class="kpi-value">${kpis.streakersPct.toFixed(0)}%</div>
              <div class="kpi-label">Streakers (≥3 days)</div>
            </div>
          </div>

          <!-- Highlights -->
          ${topHighlights.length > 0 ? `
            <div class="section">
              <h3>📋 This Week's Highlights</h3>
              <div class="highlights-list">
                ${topHighlights.map(highlight => `
                  <div class="highlight ${highlight.type}">
                    <div class="highlight-title">${highlight.title}</div>
                    <p class="highlight-description">${highlight.description}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- CSV Attachment Info -->
          <div class="csv-section">
            <h4 style="margin: 0 0 10px 0; color: #0f172a;">
              <span class="csv-icon">📊</span>Detailed Data Export
            </h4>
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              A CSV file with per-learner metrics (minutes, sessions, assignments) 
              is attached to this email for your analysis and record-keeping.
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Keep up the great work!</strong></p>
          <p>
            This automated digest is sent every Monday at 7:30 AM with your class data from the previous week.
            Questions? Contact <a href="mailto:support@learnoz.com">support@learnoz.com</a>
          </p>
          <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            To adjust your digest preferences, visit Settings → Reports in your LearnOz dashboard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
LearnOz Weekly Digest - ${className}
Week of ${weekRange}

CLASS OVERVIEW:
• Active Learners: ${kpis.activeLearners}/${kpis.totalLearners}
• Average On-Task Time: ${formatMinutes(kpis.avgOnTaskMins)}
• Total Sessions: ${kpis.totalSessions}
• Assignments Completed: ${kpis.assignmentsDone}
• Due Soon: ${kpis.dueSoon}
• Overdue: ${kpis.overdue}
• Streakers (≥3 days): ${kpis.streakersPct.toFixed(0)}%

${topHighlights.length > 0 ? `
THIS WEEK'S HIGHLIGHTS:
${topHighlights.map(highlight => `
• ${highlight.title}
  ${highlight.description}
`).join('')}
` : ''}

DETAILED DATA:
A CSV file with per-learner metrics is attached to this email for detailed analysis.

---
This automated digest is sent every Monday at 7:30 AM. 
To adjust preferences, visit Settings → Reports in LearnOz.

Questions? Contact support@learnoz.com
  `.trim();

  return {
    subject,
    html,
    text,
    attachments: [
      {
        filename: csvAttachment.filename,
        content: csvAttachment.content,
        contentType: 'text/csv'
      }
    ]
  };
}