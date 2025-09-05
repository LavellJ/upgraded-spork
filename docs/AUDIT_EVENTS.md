# Audit Events Documentation

This document provides a comprehensive reference for all audit events tracked by the LearnOz system, including their meanings, data fields, and PII redaction policies.

## Overview

The audit system tracks sensitive operations across the application for compliance, security, and operational transparency. All events are stored with:

- **Timestamp**: ISO 8601 formatted date/time
- **Actor**: Email address of the user performing the action
- **Action**: Event type identifier (see below)
- **Metadata**: JSON object with event-specific details
- **IP Address**: Request IP when available
- **User Agent**: Browser/client information when available

## PII Redaction Policy

When PII redaction is enabled (`pii=0`), the following fields are automatically redacted:

- `learnerName` → `[REDACTED]`
- `studentName` → `[REDACTED]`
- `fullName` → `[REDACTED]`
- `displayName` → `[REDACTED]`
- `learners[].name` → `[REDACTED]`
- `learners[].displayName` → `[REDACTED]`

**Note**: Admin users can disable redaction by setting `pii=1` in audit viewer requests.

## Event Categories

### Authentication Events

#### `token_issued`
**Description**: JWT token successfully issued to user  
**Metadata**: `{ role: string }`  
**PII**: None  
**Example**: User completes magic link verification

#### `token_verification_failed` 
**Description**: Invalid or expired token used  
**Metadata**: `{ reason: string, userAgent: string }`  
**PII**: None  
**Example**: User attempts access with expired JWT

#### `magic_link_sent`
**Description**: Magic link email sent to user  
**Metadata**: `{ userAgent: string, ip: string }`  
**PII**: Actor email only  
**Example**: User requests sign-in link

#### `magic_link_rate_limited`
**Description**: Magic link request blocked due to rate limiting  
**Metadata**: `{ resetIn: number, userAgent: string, ip: string }`  
**PII**: Actor email only  
**Example**: User exceeds 5 requests per hour limit

### Privacy & Data Events

#### `erasure_requested`
**Description**: Data deletion request submitted  
**Metadata**: `{ requestId: string, scope: 'learner'|'account', learnerId?: string, dueAt: number }`  
**PII**: `learnerId` may contain learner names  
**Example**: Teacher requests deletion of specific learner data

#### `erasure_canceled`
**Description**: Data deletion request canceled within grace period  
**Metadata**: `{ requestId: string }`  
**PII**: None  
**Example**: User cancels deletion request within 7-day window

#### `erasure_done`
**Description**: Data deletion request processed and completed  
**Metadata**: `{ requestId: string, scope: 'learner'|'account', deletedItems: number }`  
**PII**: None  
**Example**: System processes deletion after grace period expires

#### `dsar_export_requested`
**Description**: Data export request (DSAR) submitted  
**Metadata**: `{ requestId: string, learnerCount: number }`  
**PII**: None  
**Example**: Teacher requests data export for compliance

#### `dsar_export_ready`
**Description**: Data export ZIP file generated and ready for download  
**Metadata**: `{ requestId: string, fileSize: number, itemCount: number }`  
**PII**: None  
**Example**: System completes export processing

#### `dsar_export_downloaded`
**Description**: Data export ZIP file downloaded by requester  
**Metadata**: `{ requestId: string }`  
**PII**: None  
**Example**: User downloads generated export file

#### `dsar_export_purged`
**Description**: Data export file permanently deleted from server  
**Metadata**: `{ requestId: string }`  
**PII**: None  
**Example**: User manually purges export or 7-day retention expires

#### `dsar_export_error`
**Description**: Data export generation failed  
**Metadata**: `{ requestId: string, error: string }`  
**PII**: None  
**Example**: System error during export processing

### Content & Learning Events

#### `roster_updated`
**Description**: Learner roster modified (add/remove/edit learners)  
**Metadata**: `{ learner_count: number }`  
**PII**: None directly, but operation affects learner records  
**Example**: Teacher adds new learner to class

#### `sync_batch_processed`
**Description**: Learning progress data synchronized from client  
**Metadata**: `{ item_count: number }`  
**PII**: None directly, but syncs learner progress data  
**Example**: App uploads learning session data to cloud

#### `retention_compaction`
**Description**: Automated data retention cleanup executed  
**Metadata**: `{ files_processed: number, files_removed: number, bytes_freed: number }`  
**PII**: None  
**Example**: Weekly cleanup removes expired data

#### `backup_created`
**Description**: Automated backup of user data created  
**Metadata**: `{ backup_size: number, learner_count: number }`  
**PII**: None directly, but backs up learner data  
**Example**: Daily backup job creates user data archive

### Collaboration Events

#### `collaborator_added`
**Description**: Co-teacher or viewer added to class  
**Metadata**: `{ classId: string, collaboratorEmail: string, role: string, ip: string }`  
**PII**: `collaboratorEmail` contains email address  
**Example**: Teacher invites colleague as co-teacher

#### `collaborator_removed`
**Description**: Collaborator removed from class  
**Metadata**: `{ classId: string, collaboratorEmail: string, role: string, ip: string }`  
**PII**: `collaboratorEmail` contains email address  
**Example**: Teacher removes co-teacher access

#### `invite_sent`
**Description**: Collaboration invitation sent via email  
**Metadata**: `{ classId: string, inviteeEmail: string, className: string, ip: string }`  
**PII**: `inviteeEmail` contains email address  
**Example**: System sends co-teacher invite email

#### `invite_accepted`
**Description**: Collaboration invitation accepted by recipient  
**Metadata**: `{ classId: string, inviteeEmail: string, role: string, ip: string }`  
**PII**: `inviteeEmail` contains email address  
**Example**: Invited teacher accepts collaboration

#### `invite_processed`
**Description**: Invitation token processed (accepted or expired)  
**Metadata**: `{ classId: string, result: string, ip: string }`  
**PII**: None  
**Example**: System processes invitation link click

### Referral Events

#### `referral_created`
**Description**: Teacher referral link generated  
**Metadata**: `{ code: string, referralUrl: string, ip: string }`  
**PII**: None  
**Example**: Teacher creates referral link for colleague

#### `referral_deleted`
**Description**: Teacher referral link deleted  
**Metadata**: `{ code: string, ip: string }`  
**PII**: None  
**Example**: Teacher removes referral link

#### `referral_click`
**Description**: Someone clicks on referral link  
**Metadata**: `{ code: string, ownerEmail: string, ip: string, userAgent: string }`  
**PII**: `ownerEmail` contains email address  
**Example**: New user follows teacher's referral link

### Administrative Events

#### `admin_dump`
**Description**: Admin exports user data dump  
**Metadata**: `{ target_user: string }`  
**PII**: `target_user` may contain email addresses  
**Example**: Support exports user data for troubleshooting

#### `audit_log_access`
**Description**: Audit log accessed by admin/guide  
**Metadata**: `{}`  
**PII**: None  
**Example**: Admin views audit log in viewer interface

#### `teacher_digest_sent`
**Description**: Weekly teacher summary email sent  
**Metadata**: `{ learnerCount: number, totalProgress: number }`  
**PII**: None directly, but summarizes learner progress  
**Example**: System sends weekly progress summary

#### `teacher_digest_failed`
**Description**: Weekly teacher summary email failed to send  
**Metadata**: `{ error: string, learnerCount: number }`  
**PII**: None  
**Example**: Email service error prevents digest delivery

### System Events

#### `email_send_error`
**Description**: System failed to send email notification  
**Metadata**: `{ type: string, recipient: string, error: string }`  
**PII**: `recipient` contains email address  
**Example**: SMTP error prevents magic link delivery

## Usage in Audit Viewer

The audit viewer provides several ways to filter and explore these events:

### Quick Filter Chips

- **Privacy Events**: `erasure_*`, `dsar_*` actions
- **Auth Events**: `token_*`, `magic_link_*` actions  
- **Content Events**: `roster_*`, `sync_*`, `collaborator_*` actions

### Search Capabilities

- **Text Search**: Searches within `action` and `meta` fields
- **Email Filter**: Filters by actor email address
- **Action Filter**: Exact match on action type
- **Date Range**: Filter by timestamp range
- **PII Toggle**: Show/hide redacted personally identifiable information

### CSV Export

All filtered results can be exported as CSV with the following columns:
- `timestamp`: ISO 8601 formatted date/time
- `email`: Actor email address (or empty)
- `action`: Event type identifier
- `meta`: JSON metadata (PII redacted if applicable)

## Compliance Notes

### FERPA Compliance
- Learner names and identifiers are automatically redacted unless explicitly requested by admin
- Educational records access is logged for transparency
- Data retention follows institutional policies

### GDPR Compliance  
- Data processing activities are comprehensively logged
- Data subject requests (DSAR) are tracked end-to-end
- Erasure requests include grace periods and audit trails
- Cross-border data transfers are logged when applicable

### Security Monitoring
- Authentication failures and rate limiting events enable threat detection
- Administrative actions provide accountability trail
- System events support operational security monitoring

## Implementation Details

### Storage
- Events stored in SQLite `audit_log` table with indexed timestamps
- Metadata stored as JSON text for flexible querying
- Automatic cleanup removes entries older than retention period

### Performance
- Database queries optimized with appropriate indexes
- Pagination prevents large result sets
- CSV export streams results to prevent memory issues

### API Access
- `GET /api/admin/audit` - Paginated audit log with filtering
- `GET /api/admin/audit/actions` - List of available action types
- `GET /api/admin/audit/csv` - CSV export of filtered results
- Authentication required: Admin or Guide role only