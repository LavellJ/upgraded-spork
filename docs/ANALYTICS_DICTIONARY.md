# Analytics Dictionary

This document defines all analytics data collected by LearnOz, including data types, retention policies, and storage locations to ensure transparency and privacy compliance.

## Overview

LearnOz collects minimal, educational-focused analytics to support personalized learning and provide insights to educators. All data is collected with privacy-first principles and clear retention policies.

## Data Collection Categories

### 1. On-Task Time Tracking (`onTask` ticks)

**Purpose:** Measure active engagement time to understand learning patterns and focus duration.

**Data Structure:**
```typescript
type OnTaskTick = {
  at: number;                           // Timestamp (milliseconds)
  kind: 'start' | 'stop' | 'idle' | 'resume';  // Activity state
  source: 'lesson' | 'journal';        // Learning context
}
```

**Collection Details:**
- **Triggers:** Automatic detection during lessons and journal sessions
- **Idle Detection:** 60-second timeout with resume tracking
- **Precision:** Excludes idle periods to measure only active engagement
- **Storage:** Local browser storage, namespaced per learner
- **Retention:** 5,000 most recent entries per learner
- **Cloud Sync:** Yes, when authenticated

**Privacy Notes:**
- No personally identifiable content captured
- Only timestamps and engagement states recorded
- Used for progress insights and attention span analysis

### 2. Weekly Return Metrics (`weeklyReturn`)

**Purpose:** Track learning retention and re-engagement patterns over time.

**Data Structure:**
```typescript
interface WeeklyReturnMetric {
  returnedWithin7d: boolean;    // Whether learner returned within 7 days
  lastActiveISO: string;        // Last activity date (YYYY-MM-DD)
}
```

**Collection Details:**
- **Calculation:** Derived from lesson_finish and journal_finish events
- **Window:** 7-day rolling window from last activity
- **Storage:** Computed on-demand from progress events
- **Retention:** Inherits from underlying progress events (5,000 entries)
- **Cloud Sync:** Computed from synced progress data

**Privacy Notes:**
- No direct data collection - computed from existing progress events
- Only learning activity dates analyzed
- Used for engagement pattern analysis

### 3. Session Streak Tracking (`sessionStreak`)

**Purpose:** Motivate consistent learning through streak gamification.

**Data Structure:**
```typescript
interface SessionStreakMetric {
  current: number;     // Current consecutive days with activity
  best: number;        // Longest streak ever achieved
}
```

**Collection Details:**
- **Calculation:** Derived from lesson_finish and journal_finish events
- **Granularity:** Calendar days (local timezone)
- **Storage:** Computed on-demand from progress events
- **Retention:** Inherits from underlying progress events
- **Cloud Sync:** Computed from synced progress data

**Privacy Notes:**
- No direct data collection - computed from existing events
- Only completion dates analyzed for consecutive patterns
- Used for motivation and progress tracking

### 4. Funnel Analytics (`funnel` events)

**Purpose:** Track key learning milestones and conversion rates through the educational journey.

**Data Structure:**
```typescript
type FunnelEvent = {
  kind: 'funnel';
  at: number;          // Timestamp (milliseconds)
  step: 'onboard' | 'first_lesson_start' | 'first_lesson_finish' | 
        'first_journal' | 'assignment_received' | 'three_completions';
}
```

**Key Milestones:**
1. **onboard** - Completed initial profile setup
2. **first_lesson_start** - Started first learning activity
3. **first_lesson_finish** - Completed first learning activity
4. **first_journal** - Opened journal for first time
5. **assignment_received** - Received assignment via URL import
6. **three_completions** - Completed 3 or more lessons total

**Collection Details:**
- **Triggers:** Automatic on reaching each milestone (once only)
- **Deduplication:** Each step tracked only once per learner
- **Storage:** Local browser storage with progress events
- **Retention:** 5,000 most recent events per learner
- **Cloud Sync:** Yes, when authenticated

**Privacy Notes:**
- Only milestone timestamps captured, no content
- Used for product improvement and educational insights
- Helps identify where learners need additional support

### 5. Scout Analytics (`scout_analytics`)

**Purpose:** Analyze effectiveness of AI-powered learning assistant interventions.

**Data Structure:**
```typescript
type ScoutAnalyticsEvent = {
  kind: 'scout_analytics';
  at: number;                    // Timestamp
  id: string;                    // Message identifier (not content)
  priority: 'info' | 'actionable' | 'critical';
  action: 'shown' | 'clicked' | 'dismissed' | 'auto_dismiss' | 'routed_inbox';
  dwellMs?: number;             // Time message was visible
  sessionId: string;            // Session identifier
  abVariant?: Record<string, string>;  // A/B test variants
}
```

**Key Metrics:**
- **Show Rate:** Messages shown per unique message type
- **CTA Click-Through Rate:** Actionable message click rate
- **Median Dwell Time:** P50 time spent viewing messages
- **Session Dose P95:** 95th percentile messages shown per session
- **Assignment Nudges:** Count of assignment-related prompts

**Collection Details:**
- **Triggers:** Scout message interactions (show, click, dismiss)
- **Content:** Message IDs only, never message text or responses
- **Storage:** Local browser storage with progress events
- **Retention:** 5,000 most recent events per learner
- **Cloud Sync:** Yes, when authenticated

**Privacy Notes:**
- No message content stored, only interaction metadata
- Used for improving AI assistant helpfulness
- Session IDs are temporary and reset frequently

### 6. Sync Error Logs (`sync_errors`)

**Purpose:** Monitor system reliability and identify technical issues for resolution.

**Data Structure:**
```typescript
interface TransportError {
  type: 'fatal' | 'retryable' | 'network';
  code: number;                 // HTTP status code
  message: string;              // Technical error description
  userMessage: string;          // User-friendly error message
}
```

**Collection Details:**
- **Triggers:** Failed sync operations, network errors, authentication issues
- **Storage:** Development buffer only (50 most recent entries)
- **Retention:** Session-based (cleared on app restart)
- **Cloud Sync:** Development logs only, not synced
- **Production:** Error counts only, no detailed logs

**Privacy Notes:**
- No user content in error logs
- Only technical error codes and generic messages
- Used exclusively for system reliability monitoring
- Development logs cleared frequently

## Data Storage & Retention

### Local Storage
- **Location:** Browser localStorage with namespace isolation
- **Encryption:** Not encrypted locally (considered non-sensitive)
- **Cleanup:** Automatic size management with LRU eviction
- **Access:** JavaScript only, same-origin policy protected

### Cloud Storage (When Authenticated)
- **Location:** Replit-managed PostgreSQL database
- **Encryption:** AES-256 encryption at rest
- **Transport:** TLS 1.3 for all data transmission
- **Retention:** 365 days with automatic cleanup
- **Access:** User-controlled via authentication tokens

### Data Retention Policies

| Data Type | Local Retention | Cloud Retention | Cleanup Trigger |
|-----------|----------------|-----------------|-----------------|
| OnTask Ticks | 5,000 entries | 365 days | Size/age limits |
| Progress Events | 5,000 entries | 365 days | Size/age limits |
| Scout Analytics | 5,000 entries | 365 days | Size/age limits |
| Sync Errors | 50 entries (dev only) | Not stored | Session end |
| Computed Metrics | Real-time calculation | Not stored directly | N/A |

## Data Access & Control

### User Rights
- **Export:** Complete data export via backup functionality
- **Deletion:** Account deletion removes all cloud data
- **Portability:** JSON format for cross-platform compatibility
- **Transparency:** This document provides complete data inventory

### Export Coverage
The `exportAll()` function includes:
- ✅ Progress events (includes funnel milestones)
- ✅ OnTask data (via namespace export)
- ✅ Scout analytics events
- ✅ All learner-specific data
- ✅ Roster and profile information
- ❌ Sync error logs (development only)

### Data Processing Basis
- **Educational Analytics:** Legitimate interest for personalized learning
- **Technical Monitoring:** Necessary for service provision
- **Product Improvement:** Aggregated, anonymized insights only
- **No Marketing:** Data never used for advertising or marketing

## Privacy Safeguards

### Data Minimization
- Only educationally-relevant metrics collected
- No personally identifiable content in analytics
- Timestamps rounded to nearest second for privacy
- Content-free message interaction tracking

### Technical Safeguards
- Client-side data validation and sanitization
- Namespace isolation prevents data leakage
- Automatic size limits prevent excessive collection
- Development-only detailed error logging

### Access Controls
- User authentication required for cloud features
- Per-learner data isolation in multi-user scenarios
- Admin access limited to aggregated, anonymized metrics
- No third-party analytics or tracking services

## Compliance Notes

### Educational Privacy Laws
- **COPPA Compliance:** No collection of personal information from children
- **FERPA Alignment:** Educational records handled appropriately
- **State Privacy Laws:** Minimal data collection meets most requirements

### Data Protection
- **Consent:** Clear disclosure of all data collection practices
- **Purpose Limitation:** Data used only for stated educational purposes
- **Storage Limitation:** Automatic retention limits enforced
- **Security:** Industry-standard encryption and access controls

## Contact & Questions

For questions about data collection, privacy practices, or to exercise data rights:
- Review the Privacy settings in the app's Teacher Panel
- Use the data export functionality for complete data access
- Educational privacy questions should be directed to your institution's privacy officer

**Last Updated:** September 2025  
**Next Review:** March 2026