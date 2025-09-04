# Pilot Playbook - LearnOz Implementation

**Complete guide for managing LearnOz classroom pilots from setup to evaluation**

This playbook covers the entire pilot lifecycle: scheduling, communications, onboarding, KPI monitoring, feedback collection, and evaluation processes.

## Table of Contents

1. [Pilot Schedule & Timeline](#pilot-schedule--timeline)
2. [Communications Plan](#communications-plan)
3. [Onboarding Process](#onboarding-process)
4. [KPI Monitoring](#kpi-monitoring)
5. [Feedback Collection](#feedback-collection)
6. [Weekly Operations](#weekly-operations)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Evaluation & Closeout](#evaluation--closeout)

## Pilot Schedule & Timeline

### Pre-Launch Phase (2 weeks before)

**Week -2: Setup & Communication**
- [ ] **Day 1**: Send teacher invite emails (see COMMS/teacher_invite_email.md)
- [ ] **Day 2**: Schedule teacher onboarding session
- [ ] **Day 3**: Prepare class roster CSV files
- [ ] **Day 4**: Test class code generation and QR code printing
- [ ] **Day 5**: Configure feature flags for controlled deployment

**Week -1: Final Preparation**
- [ ] **Day 1**: Conduct teacher onboarding session
- [ ] **Day 2**: Import class rosters and generate class codes
- [ ] **Day 3**: Test all classroom devices and projectors
- [ ] **Day 4**: Send parent intro emails (see COMMS/parent_intro_email.md)
- [ ] **Day 5**: Final technical readiness check

### Launch Phase (Weeks 1-2)

**Week 1: Soft Launch**
- [ ] **Monday**: First classroom session with teacher support
- [ ] **Wednesday**: Check initial engagement metrics
- [ ] **Friday**: Weekly progress review and adjustments
- [ ] **Daily**: Monitor error logs and user feedback

**Week 2: Full Implementation**
- [ ] **Monday**: All classes active, independent teacher operation
- [ ] **Wednesday**: Mid-week performance check
- [ ] **Friday**: First weekly KPI report generation
- [ ] **Sunday**: Automated weekly reports sent to teachers

### Active Pilot Phase (Weeks 3-8)

**Weekly Rhythm:**
- [ ] **Monday**: Review weekend KPI reports
- [ ] **Tuesday**: Check for technical issues or feedback
- [ ] **Wednesday**: Mid-week engagement monitoring
- [ ] **Thursday**: Review assignment completion trends
- [ ] **Friday**: Weekly teacher check-in
- [ ] **Sunday**: Generate and distribute weekly reports

### Evaluation Phase (Weeks 9-10)

**Week 9: Data Collection**
- [ ] **Monday**: Begin comprehensive data export
- [ ] **Wednesday**: Teacher feedback interviews
- [ ] **Friday**: Parent feedback collection

**Week 10: Analysis & Closeout**
- [ ] **Monday**: Compile final analytics and insights
- [ ] **Wednesday**: Prepare pilot evaluation report
- [ ] **Friday**: Present findings to stakeholders

## Communications Plan

### Teacher Communications

**Initial Contact**
- **Timeline**: 2 weeks before launch
- **Method**: Email invitation (teacher_invite_email.md)
- **Content**: Pilot overview, benefits, time commitment, next steps
- **Follow-up**: Phone call within 3 days if no response

**Onboarding Session**
- **Timeline**: 1 week before launch
- **Duration**: 45 minutes
- **Format**: Video call or in-person
- **Agenda**:
  1. Platform overview and navigation (10 min)
  2. Class setup and QR code printing (10 min)
  3. Weekly dashboard walkthrough (10 min)
  4. Troubleshooting and support contacts (10 min)
  5. Q&A (5 min)

**Weekly Check-ins**
- **Timeline**: Every Friday during active phase
- **Duration**: 15 minutes
- **Method**: Email or brief call
- **Topics**: Technical issues, student engagement, feature requests

**Final Interview**
- **Timeline**: Week 9 of pilot
- **Duration**: 30 minutes
- **Method**: Video call
- **Topics**: Overall experience, student outcomes, recommendations

### Parent Communications

**Introduction Email**
- **Timeline**: 1 week before launch
- **Content**: See parent_intro_email.md
- **Include**: Quick start guide, privacy summary, support contact

**Weekly Progress Reports**
- **Timeline**: Every Sunday starting week 2
- **Format**: Printable PDF summary
- **Content**: Child's weekly accomplishments, learning insights, encouragement
- **Delivery**: Automatic email or print-at-home option

**Feedback Collection**
- **Timeline**: Week 8 of pilot
- **Method**: Optional survey link in weekly report
- **Content**: Learning outcomes, platform usability, satisfaction

### Student Communications

**Welcome & Orientation**
- **Timeline**: First day of pilot
- **Method**: In-class introduction by teacher
- **Content**: Platform purpose, navigation basics, getting help

**Ongoing Motivation**
- **Method**: Scout AI assistant messages (throttled)
- **Frequency**: 2-3 messages per week maximum
- **Content**: Encouragement, learning tips, progress celebration

## Onboarding Process

### Teacher Onboarding Steps

**1. Account Setup (5 minutes)**
- [ ] Access LearnOz application URL
- [ ] Navigate to Guide/Teacher mode
- [ ] Verify dashboard loads correctly

**2. Class Creation (10 minutes)**
- [ ] Import class roster via CSV
- [ ] Review student profiles created
- [ ] Generate and print class QR codes
- [ ] Test projector mode if applicable

**3. Feature Configuration (10 minutes)**
- [ ] Access Feature Flags (DEV) panel
- [ ] Configure Scout Guardrails (recommended: ON)
- [ ] Set Projector Mode Default (if classroom has shared displays)
- [ ] Review assignment nudge settings

**4. Dashboard Familiarization (15 minutes)**
- [ ] Navigate weekly dashboard
- [ ] Understand pilot overview KPIs
- [ ] Test CSV export functionality
- [ ] Review parent summary generation

**5. Support & Contacts (5 minutes)**
- [ ] Bookmark support documentation
- [ ] Save technical support contact information
- [ ] Understand escalation process for issues

### Student Onboarding (Classroom Session)

**First 10 Minutes: Introduction**
- [ ] Teacher explains LearnOz purpose and benefits
- [ ] Demonstrate QR code scanning or manual class code entry
- [ ] Show students how to create/select their profile

**Next 10 Minutes: Navigation**
- [ ] Guide through learning island interface
- [ ] Demonstrate lesson selection and starting
- [ ] Show how to access Scout AI assistant

**Next 10 Minutes: Practice**
- [ ] Students start first lesson
- [ ] Teacher monitors for technical issues
- [ ] Help students understand progress tracking

**Final 5 Minutes: Q&A**
- [ ] Address student questions
- [ ] Remind students about getting help
- [ ] Encourage exploration and learning

## KPI Monitoring

### Core Metrics (Tracked Weekly)

**Engagement Metrics**
- **Total Learners**: All students with profiles in pilot classes
- **Average On-Task Minutes**: Time spent actively learning per student per week
- **7-Day Return Rate**: Percentage of students who return to app within 7 days
- **Session Streak**: Consecutive days of learning activity

**Academic Progress**
- **Assignment Completion %**: Lessons completed vs. assigned per week
- **Subject Balance**: Distribution of time across literacy, math, science, HASS
- **Skill Progression**: Movement through learning paths and dependencies

**Satisfaction Indicators**
- **NPS Score**: Net Promoter Score from throttled student surveys
- **Support Requests**: Volume and type of help requests
- **Feature Usage**: Adoption of Scout AI, journal writing, progress tracking

### Warning Indicators

**Red Flags (Immediate Action Required)**
- [ ] 7-day return rate < 40%
- [ ] Average on-task time < 10 minutes/week
- [ ] Assignment completion rate < 25%
- [ ] Multiple technical issues reported

**Yellow Flags (Monitor Closely)**
- [ ] 7-day return rate < 60%
- [ ] Average on-task time < 20 minutes/week
- [ ] Assignment completion rate < 50%
- [ ] NPS score < 6.0 (if sufficient responses)

**Green Indicators (Pilot Healthy)**
- [ ] 7-day return rate > 70%
- [ ] Average on-task time > 30 minutes/week
- [ ] Assignment completion rate > 75%
- [ ] NPS score > 7.0 (if sufficient responses)

### Data Collection Points

**Automated (Weekly)**
- [ ] Pilot overview dashboard export (CSV)
- [ ] Individual class dashboards (CSV)
- [ ] System error logs and performance metrics
- [ ] Feature flag usage analytics

**Manual (Bi-weekly)**
- [ ] Teacher feedback forms
- [ ] Support ticket categorization
- [ ] Parent feedback collection
- [ ] Student interview notes (optional)

## Feedback Collection

### Student Feedback

**NPS Surveys (Throttled)**
- **Trigger**: After 20+ minutes on-task OR 3+ completed activities
- **Frequency**: Maximum once per 14 days per student
- **Questions**: 
  - "How likely are you to recommend LearnOz to a friend?" (0-10 scale)
  - Optional: "What did you like most about learning today?"
- **Privacy**: Anonymized and aggregated for reporting

**Issue Reporting**
- **Access**: Via feedback widget (development environments only)
- **Content**: Bug reports, confusion feedback, feature ideas
- **PII Protection**: All personal identifiers automatically masked
- **Response Time**: 48 hours for technical issues

**Informal Feedback**
- **Method**: Teacher observation and notes
- **Frequency**: Ongoing during classroom sessions
- **Topics**: Engagement, frustration points, favorite features
- **Collection**: Weekly teacher check-in calls

### Teacher Feedback

**Weekly Check-ins**
- **Format**: Email questionnaire or brief phone call
- **Questions**:
  - Technical issues encountered?
  - Student engagement observations?
  - Features working well/needing improvement?
  - Support needs for upcoming week?

**Mid-Pilot Survey (Week 5)**
- **Method**: Online survey
- **Topics**: Overall satisfaction, impact on instruction, student outcomes
- **Duration**: 10 minutes
- **Incentive**: Early access to new features

**Final Interview (Week 9)**
- **Format**: 30-minute video call
- **Questions**: 
  - Overall pilot experience?
  - Impact on student learning?
  - Recommendations for improvement?
  - Would you continue using LearnOz?

### Parent Feedback

**Weekly Reports Response**
- **Method**: Optional survey link in weekly email
- **Questions**: 
  - Is your child engaged with learning?
  - Are the weekly summaries helpful?
  - Any concerns or suggestions?

**End-of-Pilot Survey (Week 8)**
- **Method**: Email survey with incentive
- **Topics**: Child's learning progress, parent satisfaction, platform usability
- **Duration**: 5 minutes
- **Incentive**: Digital learning resource

## Weekly Operations

### Monday Morning Routine (30 minutes)

**Review Weekend Reports**
- [ ] Check pilot overview KPIs for concerning trends
- [ ] Review individual class performance metrics
- [ ] Identify classes needing attention or support
- [ ] Flag technical issues from weekend usage

**Communication Prep**
- [ ] Prepare teacher check-in agendas for the week
- [ ] Draft responses to any weekend support requests
- [ ] Plan any necessary intervention or support activities

### Wednesday Mid-Week Check (15 minutes)

**Progress Monitoring**
- [ ] Check engagement metrics for current week
- [ ] Monitor assignment completion rates
- [ ] Review any new feedback or issues reported

**Early Warning System**
- [ ] Identify students with low engagement
- [ ] Flag classes with technical difficulties
- [ ] Prepare teacher outreach for Thursday/Friday

### Friday Wrap-Up (45 minutes)

**Weekly Performance Review**
- [ ] Analyze week's KPI performance vs. targets
- [ ] Categorize and prioritize any issues identified
- [ ] Document successes and positive feedback

**Teacher Check-ins**
- [ ] Conduct brief calls/emails with all pilot teachers
- [ ] Address immediate concerns or technical issues
- [ ] Gather feedback for product team

**Next Week Preparation**
- [ ] Review upcoming assignments and due dates
- [ ] Plan any feature flag adjustments needed
- [ ] Prepare support materials for identified needs

### Sunday Report Generation (Automated)

**System Activities**
- [ ] Generate weekly KPI reports for all classes
- [ ] Create parent summary reports
- [ ] Send automated emails to teachers and parents
- [ ] Archive previous week's data for analysis

## Troubleshooting Guide

### Common Technical Issues

**Students Can't Join Class**
- **Symptoms**: Class code rejected, QR code scan fails
- **Quick Fix**: 
  1. Verify class code is correct (6 characters, no O/0/I/1)
  2. Check if student profile already exists in roster
  3. Try manual code entry if QR scan fails
- **Follow-up**: Contact technical support if persists

**Projector Mode Not Working**
- **Symptoms**: Student names visible, fonts too small
- **Quick Fix**:
  1. Access Feature Flags (DEV) panel
  2. Enable "Projector Mode Default"
  3. Manually toggle projector mode if needed
- **Follow-up**: Test on actual projector before class

**Weekly Reports Not Generated**
- **Symptoms**: No reports received on Monday morning
- **Quick Fix**:
  1. Check if class has any student activity in previous week
  2. Verify email addresses are correct in system
  3. Check spam/junk folders for reports
- **Follow-up**: Manually generate reports from dashboard

**Scout Messages Too Frequent**
- **Symptoms**: Students distracted by AI messages
- **Quick Fix**:
  1. Access Feature Flags (DEV) panel
  2. Enable "Scout Guardrails"
  3. Restart student sessions if needed
- **Follow-up**: Monitor message frequency for 48 hours

### Escalation Process

**Level 1: Teacher Self-Service (0-15 minutes)**
- [ ] Check quick troubleshooting guide
- [ ] Try common fixes (refresh browser, check feature flags)
- [ ] Consult in-app help documentation

**Level 2: Email Support (1-4 hours)**
- [ ] Email technical support with issue description
- [ ] Include steps attempted and error messages
- [ ] Provide class information and timing of issue

**Level 3: Phone/Video Support (Same day)**
- [ ] Call support line for urgent classroom issues
- [ ] Schedule screen-sharing session if needed
- [ ] Receive direct assistance during class time

**Level 4: Product Team Escalation (24-48 hours)**
- [ ] Critical bugs affecting multiple classes
- [ ] Feature requests with high teacher impact
- [ ] Data integrity or privacy concerns

### Emergency Procedures

**Complete System Outage**
- [ ] **Immediate**: Notify all teachers via emergency contact list
- [ ] **Within 1 hour**: Provide status update and estimated resolution
- [ ] **Ongoing**: Send updates every 2 hours until resolved
- [ ] **Post-resolution**: Conduct root cause analysis and prevention plan

**Data Privacy Incident**
- [ ] **Immediate**: Assess scope and potential data exposure
- [ ] **Within 30 minutes**: Contain incident and preserve evidence
- [ ] **Within 2 hours**: Notify affected teachers and parents
- [ ] **Within 24 hours**: File required regulatory notifications

## Evaluation & Closeout

### Success Metrics (End of Pilot)

**Engagement Targets**
- [ ] **70%+ students** return to app weekly
- [ ] **25+ minutes** average on-task time per student per week
- [ ] **60%+ assignment completion** rate across all classes
- [ ] **80%+ teacher satisfaction** (4/5 or higher rating)

**Learning Outcomes**
- [ ] Improved student confidence in learning (teacher-reported)
- [ ] Increased completion of assigned work
- [ ] Better parent engagement with child's education
- [ ] Enhanced classroom instruction efficiency

**Technical Performance**
- [ ] **<2% error rate** across all user sessions
- [ ] **<5 second load times** for core application features
- [ ] **99%+ uptime** during school hours
- [ ] Zero critical data integrity issues

### Data Export and Analysis

**Week 9: Comprehensive Data Collection**
- [ ] Export all student progress and engagement data
- [ ] Compile all teacher and parent feedback
- [ ] Generate final KPI reports with trends
- [ ] Document all technical issues and resolutions

**Week 10: Analysis and Reporting**
- [ ] Calculate final success metrics vs. targets
- [ ] Identify most/least successful features and workflows
- [ ] Analyze correlation between engagement and outcomes
- [ ] Prepare recommendations for wider deployment

### Final Report Template

**Executive Summary**
- Pilot scope, timeline, and participation
- Key success metrics achieved
- Primary findings and recommendations
- Decision recommendation (scale, modify, or discontinue)

**Detailed Findings**
- Student engagement and learning outcomes
- Teacher satisfaction and workflow integration
- Parent feedback and home engagement
- Technical performance and reliability

**Lessons Learned**
- What worked well and should be replicated
- What needed improvement or caused issues
- Unexpected positive/negative outcomes
- Feature requests with high teacher demand

**Scaling Recommendations**
- Optimal classroom size and teacher preparation
- Essential features vs. nice-to-have features
- Support model and training requirements
- Technology infrastructure needs

### Transition Planning

**Continuing Pilot Teachers**
- [ ] Transition to production environment
- [ ] Remove development-only feature flags
- [ ] Establish ongoing support model
- [ ] Plan for expanded class roster

**New Teacher Onboarding**
- [ ] Update onboarding materials based on pilot learnings
- [ ] Streamline setup process for future deployments
- [ ] Create self-service resources for common tasks
- [ ] Establish trainer-of-trainers program

**Product Development**
- [ ] Prioritize feature requests based on pilot feedback
- [ ] Address technical debt and performance issues
- [ ] Plan next iteration of classroom features
- [ ] Design expanded analytics and reporting

---

## Contact Information

**Technical Support**
- Email: support@learnoz.edu
- Phone: 1-800-LEARNOZ
- Hours: Monday-Friday 7 AM - 6 PM School Time
- Emergency: 24/7 for critical issues

**Product Team**
- Email: pilots@learnoz.edu
- Slack: #learnoz-pilots (for participating teachers)
- Video calls: By appointment

**Pilot Coordinator**
- Primary contact for all pilot-related questions
- Weekly check-in scheduler
- Escalation point for urgent issues

---

*Last updated: September 2025 - Pilot Implementation Guide*
*Version: 1.0 - Initial deployment playbook*