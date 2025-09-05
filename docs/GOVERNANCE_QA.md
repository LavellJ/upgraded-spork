# Governance QA Checklist

## Overview

This document outlines the quality assurance procedures for LearnOz's governance features, ensuring FERPA/GDPR compliance and proper privacy controls for school deployments. All features must pass these checks before deployment.

## Pre-Deployment Checklist

### 1. Privacy Strict Mode Configuration
- [ ] **Feature Flag Control**: Verify `privacyStrictMode` flag toggles correctly in development panel
- [ ] **Growth Tab Hiding**: Confirm Growth tab disappears from Reports when strict mode enabled
- [ ] **Analytics Restriction**: Validate only essential events logged when strict mode enabled
- [ ] **Referral UI Suppression**: Check referral features are completely hidden in strict mode
- [ ] **Share/Rate Prompts**: Verify growth prompts are disabled when strict mode active

### 2. Data Subject Access Rights (DSAR) Testing

#### DSAR Request Flow
- [ ] Navigate to Privacy Hub → Data Export
- [ ] Submit export request with valid email
- [ ] Verify audit logging: Check `/audit/logs` contains `dsar_request` entry
- [ ] Confirm request appears in DSAR management panel
- [ ] Validate email notification sent to user
- [ ] Check export file generation (JSON format with all user data)
- [ ] Verify download link functionality and expiration

#### CSV Export Testing  
- [ ] Generate audit CSV export from Privacy Hub
- [ ] Validate CSV contains all required fields: timestamp, action, actor, details, IP
- [ ] Check filtering works correctly (date ranges, action types)
- [ ] Verify privacy-focused filtering excludes non-essential events in strict mode

### 3. Data Erasure/Right to be Forgotten Testing

#### Erasure Request Flow
- [ ] Navigate to Privacy Hub → Data Erasure
- [ ] Submit erasure request with confirmation
- [ ] Verify grace period countdown (default: 30 days)
- [ ] Check audit logging: Confirm `erasure_request` logged
- [ ] Validate cancellation option during grace period
- [ ] Test automatic erasure execution after grace period
- [ ] Confirm all user data removed from system

#### Grace Period Management
- [ ] Submit erasure request and verify grace period timer
- [ ] Cancel erasure during grace period - confirm data retained
- [ ] Let grace period expire - verify automatic data removal
- [ ] Check audit trail for all erasure lifecycle events

### 4. Audit System Validation

#### Audit Log Integrity
- [ ] Verify all privacy-related actions logged (auth, DSAR, erasure)
- [ ] Check log rotation and retention policies working
- [ ] Validate audit viewer filtering and search functionality
- [ ] Confirm IP address and user agent tracking
- [ ] Test CSV export of audit logs

#### Privacy Filtering
- [ ] Enable privacy strict mode
- [ ] Generate test events (analytics, scout interactions)
- [ ] Verify only essential events appear in audit logs
- [ ] Check CSV exports exclude filtered events

### 5. Feature Flag Kill-Switches

#### Critical Feature Controls
- [ ] **Scout Analytics**: Toggle `scoutGuardrails` - verify analytics blocking
- [ ] **Growth Features**: Disable `enableInvites`/`enableReferrals` - check UI hiding
- [ ] **Feedback Systems**: Toggle `enableSharePrompt`/`enableRatePrompt` - verify blocking
- [ ] **Assignment Nudges**: Test `assignmentNudges` toggle functionality

#### Emergency Disable Testing
- [ ] Simulate production issue requiring feature disable
- [ ] Toggle feature flags from development panel
- [ ] Verify immediate effect without requiring app restart
- [ ] Check fallback behaviors when features disabled

### 6. Data Retention Testing

#### Retention Policy Enforcement
- [ ] Configure custom retention periods per tenant
- [ ] Verify automated data compaction runs
- [ ] Check old data purging according to policy
- [ ] Validate retention policy respects legal hold requirements

#### Compaction Process
- [ ] Trigger manual retention compaction
- [ ] Verify files processed/removed counts accurate
- [ ] Check disk space freed calculations
- [ ] Confirm audit logging of compaction events

### 7. School Deployment Configuration

#### Default Privacy Settings
- [ ] **Privacy Strict Mode**: Verify enabled by default for school deployments
- [ ] **Growth Features**: Confirm disabled (no referrals, sharing, rating)
- [ ] **Analytics**: Check only educational events logged
- [ ] **Data Export**: Validate FERPA-compliant export formats

#### Compliance Features  
- [ ] Test parent/guardian consent flows
- [ ] Verify student data isolation between schools
- [ ] Check educator access controls and permissions
- [ ] Validate age-appropriate content filtering

## Production Deployment Notes

### Pre-Launch Requirements
1. **Feature Flags**: All privacy flags must be properly configured for production
2. **Database Migrations**: Ensure retention policy tables created
3. **Audit Storage**: Verify sufficient disk space for audit logs
4. **Monitoring**: Set up alerts for failed DSAR/erasure processes

### School District Deployments
1. **Privacy Strict Mode**: Enable by default via environment configuration
2. **Growth Features**: Completely disable referral and sharing systems  
3. **Data Retention**: Configure per district legal requirements
4. **Audit Access**: Restrict to designated compliance officers

### Post-Deployment Validation
1. **Smoke Tests**: Run basic DSAR/erasure flows
2. **Feature Flag Check**: Verify privacy strict mode working
3. **Audit Logging**: Confirm all compliance events tracked
4. **Performance**: Monitor system performance with privacy controls enabled

## Emergency Procedures

### Privacy Incident Response
1. **Immediate Actions**:
   - Enable privacy strict mode globally
   - Disable all growth features via kill-switches
   - Capture audit logs for investigation
   - Notify compliance team

2. **Data Breach Response**:
   - Trigger emergency erasure if required
   - Export affected user data for investigation
   - Document all actions in audit trail
   - Coordinate with legal team for notifications

### Rollback Procedures
- Feature flags provide immediate rollback capability
- Database retention policies can be adjusted via admin panel
- Audit logs maintain immutable record of all changes
- DSAR/erasure requests cannot be rolled back (compliance requirement)

## Testing Automation

### E2E Test Coverage
- Privacy strict mode behavior
- DSAR request and export flow
- Data erasure lifecycle
- Feature flag toggling
- Audit log generation and filtering

### Load Testing
- Large DSAR export generation
- Concurrent erasure requests
- Audit log ingestion under load
- CSV export performance with large datasets

## Compliance Validation

### FERPA Requirements
- [ ] Student data only accessible to authorized educators
- [ ] Parent/guardian consent properly captured and stored
- [ ] Data minimization principles followed
- [ ] Audit trail for all student data access

### GDPR Requirements  
- [ ] Right to access (DSAR) fully functional
- [ ] Right to rectification available
- [ ] Right to erasure with proper grace periods
- [ ] Right to portability via JSON exports
- [ ] Consent management integrated

## Sign-Off Requirements

Before production deployment, the following stakeholders must approve:
- [ ] **Engineering Lead**: Technical implementation complete
- [ ] **QA Lead**: All test cases passed
- [ ] **Privacy Officer**: Compliance requirements met
- [ ] **Legal Counsel**: Regulatory approval obtained
- [ ] **Product Manager**: Feature acceptance confirmed

---

*This checklist must be completed and signed off before any deployment containing privacy or governance features.*