interface InviteTemplateData {
  inviter: string;
  className: string;
  link: string;
}

export function renderInvite({ inviter, className, link }: InviteTemplateData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${inviter} invited you to co-teach "${className}" on LearnOz`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Co-teacher Invitation - LearnOz</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .invite-box { background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
        .invite-box h2 { color: #0c4a6e; margin: 0 0 8px 0; font-size: 24px; }
        .invite-box p { color: #075985; margin: 8px 0; font-size: 16px; }
        .button { display: inline-block; background: #0ea5e9; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background 0.2s; }
        .button:hover { background: #0284c7; }
        .footer { padding: 20px 30px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        .expires { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin: 20px 0; font-size: 14px; }
        .benefits { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 6px; padding: 16px; margin: 20px 0; }
        .benefits h3 { color: #15803d; margin: 0 0 12px 0; font-size: 16px; }
        .benefits ul { color: #166534; margin: 0; padding-left: 20px; }
        .benefits li { margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏝️ LearnOz</h1>
        </div>
        <div class="content">
          <h2>You're invited to co-teach!</h2>
          <p><strong>${inviter}</strong> has invited you to be a co-teacher for their class.</p>
          
          <div class="invite-box">
            <h2>📚 ${className}</h2>
            <p>Join as a co-teacher and help guide students through their learning journey</p>
          </div>
          
          <div class="benefits">
            <h3>🎯 As a co-teacher, you can:</h3>
            <ul>
              <li>View and manage student progress</li>
              <li>Create and assign learning activities</li>
              <li>Access class analytics and insights</li>
              <li>Collaborate with ${inviter} on teaching strategies</li>
              <li>Support students with personalized feedback</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${link}" class="button">Accept Invitation & Join Class</a>
          </div>
          
          <div class="expires">
            ⏰ This invitation expires in 7 days for security.
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0ea5e9;">${link}</p>
          
          <p>If you don't want to join this class or received this invitation by mistake, you can safely ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #64748b;">
            <strong>New to LearnOz?</strong> LearnOz is an AI-powered educational platform that helps teachers create engaging, personalized learning experiences for students. 
            Once you accept this invitation, you'll have access to powerful tools for tracking progress, creating assignments, and supporting student growth.
          </p>
        </div>
        <div class="footer">
          This email was sent by LearnOz on behalf of ${inviter}. Please do not reply to this email.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
LearnOz Co-teacher Invitation

${inviter} has invited you to be a co-teacher for their class: ${className}

As a co-teacher, you can:
• View and manage student progress
• Create and assign learning activities
• Access class analytics and insights
• Collaborate with ${inviter} on teaching strategies
• Support students with personalized feedback

Accept your invitation by clicking this link:
${link}

This invitation expires in 7 days for security.

If you don't want to join this class or received this invitation by mistake, you can safely ignore this email.

New to LearnOz? LearnOz is an AI-powered educational platform that helps teachers create engaging, personalized learning experiences for students.

---
This email was sent by LearnOz on behalf of ${inviter}.
  `.trim();

  return { subject, html, text };
}