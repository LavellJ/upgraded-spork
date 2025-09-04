// Parent summary email template for weekly learning reports
import { format } from 'date-fns';

export interface ParentSummaryParams {
  learnerName: string;
  weekStartISO: string;
  minutes: number;
  sessions: number;
  streak: { current: number; best: number };
  accomplishments: string[];     // lesson titles completed
  nextSteps: string[];           // assigned or recommended next lessons
  optOutLink?: string;
}

export function renderParentEmail(params: ParentSummaryParams): { subject: string; html: string; text: string } {
  const {
    learnerName,
    weekStartISO,
    minutes,
    sessions,
    streak,
    accomplishments,
    nextSteps,
    optOutLink
  } = params;

  // Format the week range for display
  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  
  // Format minutes into hours and minutes
  const formatTime = (totalMinutes: number): string => {
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
  };

  const subject = `${learnerName}'s Learning Summary - Week of ${format(weekStart, 'MMM d')}`;

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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { 
          color: white; 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600; 
        }
        .header .learner-name {
          color: #a7f3d0;
          font-size: 18px;
          font-weight: 500;
          margin: 8px 0 0 0;
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
          font-size: 22px;
        }
        .week-info .date-range {
          color: #64748b;
          font-size: 16px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: #fefefe;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-card.highlight {
          border-color: #10b981;
          background: #ecfdf5;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        .section {
          margin: 30px 0;
        }
        .section h3 {
          color: #0f172a;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 15px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .accomplishments-list {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 20px;
        }
        .accomplishments-list ul {
          margin: 0;
          padding-left: 20px;
        }
        .accomplishments-list li {
          margin: 8px 0;
          color: #166534;
        }
        .next-steps-list {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 20px;
        }
        .next-steps-list ul {
          margin: 0;
          padding-left: 20px;
        }
        .next-steps-list li {
          margin: 8px 0;
          color: #92400e;
        }
        .empty-message {
          text-align: center;
          color: #64748b;
          font-style: italic;
          padding: 20px;
        }
        .footer {
          padding: 30px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }
        .opt-out {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #94a3b8;
        }
        .opt-out a {
          color: #3b82f6;
          text-decoration: none;
        }
        .streak-badge {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 20px;
          margin-left: 10px;
        }
        .print-only {
          display: none;
        }
        
        /* Print styles */
        @media print {
          body { background: white; }
          .container { box-shadow: none; margin: 0; }
          .print-only { display: block; }
          .header { break-inside: avoid; }
          .section { break-inside: avoid; }
          .footer { break-before: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏝️ LearnOz</h1>
          <p class="learner-name">Learning Summary for ${learnerName}</p>
        </div>
        
        <div class="content">
          <div class="week-info">
            <h2>Week of ${weekRange}</h2>
            <p class="date-range">Weekly Learning Report</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card highlight">
              <div class="stat-value">${formatTime(minutes)}</div>
              <div class="stat-label">Learning Time</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${sessions}</div>
              <div class="stat-label">Sessions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${streak.current}</div>
              <div class="stat-label">Current Streak</div>
              ${streak.current >= 3 ? '<div class="streak-badge">🔥 On Fire!</div>' : ''}
            </div>
          </div>

          ${accomplishments.length > 0 ? `
            <div class="section">
              <h3>✅ This Week's Accomplishments</h3>
              <div class="accomplishments-list">
                <ul>
                  ${accomplishments.map(lesson => `<li>${lesson}</li>`).join('')}
                </ul>
              </div>
            </div>
          ` : `
            <div class="section">
              <h3>✅ This Week's Accomplishments</h3>
              <div class="empty-message">No lessons completed this week. Encourage ${learnerName} to explore the learning activities!</div>
            </div>
          `}

          ${nextSteps.length > 0 ? `
            <div class="section">
              <h3>🎯 Up Next</h3>
              <div class="next-steps-list">
                <ul>
                  ${nextSteps.map(lesson => `<li>${lesson}</li>`).join('')}
                </ul>
              </div>
            </div>
          ` : ''}

          ${streak.best > streak.current && streak.best >= 3 ? `
            <div class="section">
              <h3>🏆 Best Learning Streak</h3>
              <p style="color: #64748b; margin: 0;">
                ${learnerName}'s personal best is ${streak.best} days in a row! 
                ${streak.current > 0 ? `Current streak: ${streak.current} days.` : 'A great goal to work towards again!'}
              </p>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p><strong>Keep up the great work!</strong></p>
          <p>
            Regular learning builds strong foundations. Even 10-15 minutes a day can make a big difference 
            in ${learnerName}'s educational journey.
          </p>
          <p>
            If you have any questions about ${learnerName}'s progress or need help with LearnOz, 
            please don't hesitate to reach out to your teacher or guide.
          </p>
          
          ${optOutLink ? `
            <div class="opt-out">
              <p>
                You're receiving this because you're registered as ${learnerName}'s parent or guardian. 
                <a href="${optOutLink}">Update email preferences</a> or contact us if you have questions.
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
LearnOz Learning Summary for ${learnerName}
Week of ${weekRange}

LEARNING STATS:
• Time spent learning: ${formatTime(minutes)}
• Learning sessions: ${sessions}
• Current streak: ${streak.current} days${streak.current >= 3 ? ' 🔥' : ''}

THIS WEEK'S ACCOMPLISHMENTS:
${accomplishments.length > 0 
  ? accomplishments.map(lesson => `• ${lesson}`).join('\n')
  : `No lessons completed this week. Encourage ${learnerName} to explore the learning activities!`
}

${nextSteps.length > 0 ? `
UP NEXT:
${nextSteps.map(lesson => `• ${lesson}`).join('\n')}
` : ''}

${streak.best > streak.current && streak.best >= 3 ? `
PERSONAL BEST STREAK: ${streak.best} days in a row!
${streak.current > 0 ? `Current streak: ${streak.current} days.` : 'A great goal to work towards again!'}
` : ''}

Keep up the great work!

Regular learning builds strong foundations. Even 10-15 minutes a day can make a big difference in ${learnerName}'s educational journey.

If you have any questions about ${learnerName}'s progress or need help with LearnOz, please don't hesitate to reach out to your teacher or guide.

${optOutLink ? `
You're receiving this because you're registered as ${learnerName}'s parent or guardian. Update email preferences: ${optOutLink}
` : ''}

---
This email was sent by LearnOz. Please do not reply to this email.
  `.trim();

  return {
    subject,
    html,
    text
  };
}