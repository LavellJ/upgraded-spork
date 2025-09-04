# Feedback System Documentation

**Complete guide to LearnOz feedback collection, data handling, and opt-out processes**

This document explains how LearnOz collects feedback from students, what data is included, how it's protected, and how to opt out of feedback collection.

## Table of Contents

1. [Feedback System Overview](#feedback-system-overview)
2. [Types of Feedback Collected](#types-of-feedback-collected)
3. [Data Content and Protection](#data-content-and-protection)
4. [Opt-Out Process](#opt-out-process)
5. [Technical Implementation](#technical-implementation)
6. [Privacy Safeguards](#privacy-safeguards)

## Feedback System Overview

LearnOz uses a multi-layer feedback system to improve the learning experience while maintaining strict privacy protections. All feedback collection is **optional** and can be disabled at any time.

### Feedback Categories

**1. Product Improvement Feedback**
- Bug reports and technical issues
- Feature suggestions and ideas  
- User experience confusion points

**2. Learning Experience Surveys**
- NPS (Net Promoter Score) satisfaction surveys
- Brief learning reflection prompts
- Engagement and motivation indicators

**3. Technical Diagnostics**
- Error logs and performance metrics
- Browser compatibility information
- Feature usage analytics

### Development-Only Restrictions

**Important**: Feedback collection is currently restricted to development environments only. This ensures:
- No accidental feedback collection from production users
- Safe testing of feedback mechanisms
- Controlled rollout when ready for wider deployment

## Types of Feedback Collected

### 1. NPS Satisfaction Surveys

**When Shown:**
- After a student has 20+ minutes of on-task learning time, OR
- After completing 3+ learning activities
- Maximum once every 14 days per student
- Can be snoozed for 7 days if student closes without answering

**Questions Asked:**
- "How likely are you to recommend LearnOz to a friend?" (0-10 scale)
- Optional follow-up: "What did you like most about learning today?"

**Data Collected:**
```json
{
  "score": 8,
  "note": "I liked the math games!",
  "at": 1704067200000,
  "onTaskMinutes": 35,
  "completionCount": 4
}
```

**Throttling Protection:**
- Students won't see surveys too frequently
- Respects user dismissals and snooze requests
- Automatically disabled if student consistently opts out

### 2. General Feedback Widget

**Access:** 
- Available via floating feedback button (development mode only)
- Accessible from settings or help menus

**Feedback Types:**
- **Ideas**: Suggestions for new features or improvements
- **Bug Reports**: Technical issues or problems encountered
- **Confusion**: Areas where students need clearer instructions

**Data Collected:**
```json
{
  "kind": "idea",
  "text": "Can you add more space-themed lessons?",
  "email": "optional@contact.com",
  "meta": {
    "userAgent": "Mozilla/5.0...",
    "locale": "en-US",
    "classActive": "HASH123",
    "guardrailsOn": true
  },
  "submittedAt": 1704067200000
}
```

### 3. Issue Reporter (Technical Problems)

**Purpose:** Collect detailed technical information for bug fixes

**Triggered By:**
- Students reporting specific errors or crashes
- Teachers encountering technical difficulties
- Automated error detection (with user consent)

**Environmental Data Collected:**
```json
{
  "timestamp": 1704067200000,
  "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "platform": "Win32",
  "locale": "en-US",
  "app": {
    "version": "1.0.0",
    "packs": ["base-au"],
    "guardrails": true,
    "learnerCount": 25,
    "activeLearnerHash": "abc123def" // PII-masked
  },
  "performance": {
    "memory": {
      "usedJSHeapSize": 50000000,
      "totalJSHeapSize": 100000000
    }
  },
  "viewport": {
    "width": 1920,
    "height": 1080,
    "pixelRatio": 1
  }
}
```

## Data Content and Protection

### Personal Information Handling

**What is NEVER collected:**
- Student real names or personal identifiers
- Actual learning content or answers
- Location data or device tracking
- Contact information (unless voluntarily provided)

**What is automatically masked:**
- Student names → Replaced with secure hashes (e.g., "abc123def")
- Class names → Replaced with secure hashes  
- Any personal identifiers in error logs
- Device-specific identifiers

### Data Storage and Retention

**Local Storage First:**
- All feedback stored locally on device by default
- Students maintain full control over their data
- Can be deleted anytime through browser settings

**Optional Cloud Submission:**
- Only submitted if explicitly enabled by teacher/administrator
- Uses encrypted connections and secure storage
- Automatically deleted after analysis period (90 days maximum)

**No Third-Party Sharing:**
- Feedback data never shared with advertising companies
- Never sold or provided to external parties
- Used exclusively for LearnOz product improvement

### Anonymization Process

**Automatic PII Removal:**
```javascript
// Example of automatic anonymization
{
  "originalData": {
    "student": "Sarah Johnson",
    "class": "Ms. Smith's 3rd Grade",
    "feedback": "I love the reading lessons!"
  },
  "anonymizedData": {
    "studentHash": "a1b2c3d4e5",
    "classHash": "f6g7h8i9j0", 
    "feedback": "I love the reading lessons!"
  }
}
```

## Opt-Out Process

### Complete Feedback Opt-Out

**For Individual Students:**
1. Open LearnOz settings panel
2. Navigate to "Privacy & Data" section  
3. Toggle "Feedback Collection" to OFF
4. Confirm selection
5. Restart application for changes to take effect

**For Entire Classes:**
1. Teacher accesses Feature Flags (DEV) panel
2. Disable "Enable Feedback Widget"
3. Disable "Enable NPS Surveys"
4. Disable "Enable Issue Reporter"
5. Changes apply immediately to all class devices

**For Schools/Districts:**
1. Contact LearnOz administrator support
2. Request organization-wide feedback opt-out
3. Settings applied to all accounts in organization
4. Cannot be overridden by individual teachers

### Partial Opt-Out Options

**NPS Surveys Only:**
- Set Feature Flag "Enable NPS" to OFF
- Students can still provide general feedback and bug reports
- Issue reporting remains available for technical support

**Bug Reports Only:**
- Keep "Enable Issue Reporter" ON
- Disable other feedback mechanisms
- Allows technical support while minimizing data collection

**Anonymous Feedback Only:**
- Configure system to never request email addresses
- Disable detailed environmental data collection
- Keep basic feedback mechanisms for product improvement

### Data Deletion Process

**Immediate Local Deletion:**
- Clear browser data and cache
- Delete LearnOz local storage keys
- Uninstall LearnOz PWA (if installed)

**Cloud Data Deletion Request:**
1. Email privacy@learnoz.edu with request
2. Include student/class information for identification
3. Specify data types to delete (feedback, analytics, etc.)
4. Receive confirmation within 48 hours
5. Deletion completed within 7 business days

**Verification Process:**
- Request confirmation of data deletion
- Receive report of what data was found and removed
- Get verification that no copies remain in backup systems

## Technical Implementation

### Feature Flag Controls

**Available Flags:**
```javascript
{
  "enableFeedbackWidget": false,    // General feedback collection
  "enableNps": false,               // NPS satisfaction surveys  
  "enableIssueReporter": false      // Technical problem reporting
}
```

**Flag Behavior:**
- Flags checked before displaying any feedback UI
- Components gracefully disable when flags are OFF
- Changes take effect immediately without restart
- Settings persist across browser sessions

### Development vs Production

**Development Environment:**
- All feedback features available for testing
- Clear indicators showing "DEV" mode active
- Feedback data stored locally only by default
- Enhanced debugging and error information

**Production Environment:**
- Feedback features disabled by default
- Must be explicitly enabled by administrator
- Enhanced privacy protections active
- Automatic anonymization of all data

### Data Flow Architecture

**Collection → Processing → Storage:**
```
Student Device → Local Storage → (Optional) Encrypted Upload → Secure Cloud Storage → Analysis → Deletion
```

**Privacy Checkpoints:**
1. **Device Level**: PII masking before storage
2. **Upload Level**: Encryption and anonymization
3. **Server Level**: Additional PII scanning and removal
4. **Analysis Level**: Aggregation and de-identification
5. **Retention Level**: Automatic deletion after analysis period

## Privacy Safeguards

### Built-In Protections

**Automatic PII Detection:**
- Scans all feedback text for names, emails, addresses
- Uses pattern matching to identify personal information
- Replaces detected PII with anonymous tokens
- Logs PII detection events for security monitoring

**Minimum Data Principle:**
- Collects only data necessary for stated purpose
- Removes unnecessary technical details from reports
- Strips out debugging information before storage
- Uses data aggregation to reduce individual identification

**Consent Management:**
- Explicit opt-in required for cloud data submission
- Clear explanations of what data is collected
- Easy opt-out process with immediate effect
- Regular consent verification for long-term users

### Access Controls

**Data Access Restrictions:**
- Feedback data accessible only to development team
- No access for marketing or sales teams
- Individual student data never shared
- Only aggregated insights used for product decisions

**Security Measures:**
- Encrypted data transmission (TLS 1.3)
- Encrypted data storage (AES-256)
- Access logging and monitoring
- Regular security audits and penetration testing

### Compliance Framework

**Educational Privacy Laws:**
- COPPA (Children's Online Privacy Protection Act) compliant
- FERPA (Family Educational Rights and Privacy Act) aligned
- State educational privacy requirements met
- International privacy standards (GDPR-inspired)

**Regular Reviews:**
- Quarterly privacy impact assessments
- Annual third-party privacy audits
- Ongoing legal compliance verification
- Student and parent feedback on privacy practices

## Support and Questions

### Feedback About Feedback

**Concerns or Questions:**
- Email: privacy@learnoz.edu
- Include: "Feedback System Question" in subject line
- Response time: Within 48 hours during business days

**Request Data Report:**
- See exactly what feedback data we have from your student
- Request includes dates, types, and content of feedback
- Available within 7 business days of request

**Technical Issues:**
- Problems with opt-out process
- Questions about data deletion
- Issues with feature flag settings
- Contact: support@learnoz.edu

### Transparency Reporting

**Annual Privacy Report:**
- Total feedback submissions by type
- Anonymization effectiveness metrics
- Opt-out request statistics
- Data deletion completion rates
- Available at: learnoz.edu/privacy-report

---

## Quick Reference

### Contact Information
- **General Questions**: support@learnoz.edu
- **Privacy Concerns**: privacy@learnoz.edu  
- **Data Deletion**: privacy@learnoz.edu
- **Technical Issues**: support@learnoz.edu

### Key Settings
- **Feedback Widget**: Feature Flags → Enable Feedback Widget
- **NPS Surveys**: Feature Flags → Enable NPS
- **Bug Reports**: Feature Flags → Enable Issue Reporter
- **Complete Opt-Out**: Contact privacy@learnoz.edu

### Data Retention
- **Local Storage**: Until manually deleted
- **Cloud Storage**: 90 days maximum
- **Aggregated Insights**: Retained for product improvement
- **Personal Identifiers**: Immediately anonymized

---

*Last updated: September 2025*  
*Version: 1.0 - Initial feedback documentation*