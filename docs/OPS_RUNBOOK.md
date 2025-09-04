# LearnOz Operations Runbook

## 🚨 Emergency Contacts

| Role | Contact | When to Call |
|------|---------|-------------|
| **Primary On-Call** | ops-primary@learnoz.edu.au | Any production incident |
| **Secondary On-Call** | ops-secondary@learnoz.edu.au | Primary unreachable (15+ minutes) |
| **Platform Lead** | platform@learnoz.edu.au | Architecture decisions, major outages |
| **Security Team** | security@learnoz.edu.au | Security incidents, data breaches |
| **Infrastructure** | infra@learnoz.edu.au | Network, hosting, database issues |

**Escalation Path**: Primary On-Call → Secondary On-Call → Platform Lead → CTO

---

## 📊 Service Level Objectives (SLOs)

### Response Time Targets
- **Sync Batch Endpoint**: 95th percentile < 2000ms
- **Authentication**: 90th percentile < 500ms  
- **Question Generation**: 95th percentile < 10000ms
- **Health Check**: 99th percentile < 100ms

### Availability Targets
- **Overall System**: 99.5% uptime (3.6 hours/month downtime)
- **Core Sync Functions**: 99.9% uptime (43 minutes/month downtime)
- **Authentication**: 99.8% uptime (1.4 hours/month downtime)

### Error Rate Targets
- **5xx Errors**: < 0.1% of all requests
- **4xx Errors**: < 5% of all requests
- **Failed Sync Operations**: < 0.5% of sync requests

---

## 🔍 Monitoring & Alerting Thresholds

### Critical Alerts (Page Immediately)
```yaml
sync_batch_p95_latency > 5000ms:
  threshold: 5 consecutive minutes
  impact: "Sync operations severely degraded"
  action: "Investigate backend performance, check database"

error_rate_5xx > 1%:
  threshold: 2 consecutive minutes  
  impact: "System experiencing server errors"
  action: "Check logs, restart if needed, escalate"

health_check_failing:
  threshold: 3 consecutive failures
  impact: "Service appears down"
  action: "Immediate investigation, check all services"

database_connection_errors > 5:
  threshold: 1 minute
  impact: "Data persistence failing"
  action: "Check database connectivity, failover if needed"
```

### Warning Alerts (Investigate Within 30 Minutes)
```yaml
sync_batch_p95_latency > 3000ms:
  threshold: 10 consecutive minutes
  impact: "Sync operations degraded"
  action: "Monitor trends, investigate if worsening"

error_rate_4xx > 10%:
  threshold: 5 consecutive minutes
  impact: "High client error rate"
  action: "Check for malformed requests, API changes"

memory_usage > 85%:
  threshold: 15 consecutive minutes
  impact: "Memory pressure increasing"
  action: "Monitor for memory leaks, consider scaling"

disk_usage > 80%:
  threshold: 30 minutes
  impact: "Storage approaching capacity"
  action: "Clean old logs, plan storage expansion"
```

---

## 💾 Backup & Restore Procedures

### Automated Backup Schedule
- **Daily Backups**: 02:30 UTC (encrypted)
- **Retention Policy**: 30 days for daily, 12 months for weekly
- **Location**: `.data/backups/` (encrypted with AES-256)
- **Monitoring**: Backup success/failure alerts daily at 03:00 UTC

### Manual Backup Creation
```bash
# Create immediate backup
npm run admin:backup

# Verify backup integrity
ls -la .data/backups/
```

### Disaster Recovery Steps

#### 1. Assess the Situation
- [ ] Determine scope of data loss
- [ ] Identify last known good state
- [ ] Estimate recovery time needed
- [ ] Notify stakeholders of incident

#### 2. Execute Recovery
```bash
# Run the restore script (interactive)
tsx scripts/restore-backup.mts

# Or list available backups first
tsx scripts/restore-backup.mts --list
```

#### 3. Verify Recovery
- [ ] Check application starts successfully
- [ ] Verify user data integrity
- [ ] Test core functionality (sync, auth, question generation)
- [ ] Monitor error rates for 30 minutes

#### 4. Post-Recovery
- [ ] Update incident documentation
- [ ] Communicate status to users
- [ ] Conduct post-mortem meeting
- [ ] Implement preventive measures

### Recovery Time Objectives (RTO)
- **Data Corruption**: 2 hours maximum
- **Complete System Failure**: 4 hours maximum
- **Partial Service Degradation**: 30 minutes maximum

### Recovery Point Objectives (RPO)
- **User Data**: Maximum 24 hours of data loss
- **System Configuration**: Maximum 1 hour of changes lost
- **Analytics Data**: Maximum 48 hours acceptable

---

## 🧪 Load Testing & Health Checks

### Smoke Test Execution
```bash
# Run load smoke test (20 concurrent users, 2 minutes)
tsx scripts/load-smoke.mts

# Expected results:
# - Error rate < 2%
# - Average latency < 1000ms
# - P95 latency < 2000ms
```

### Regular Health Checks
```bash
# Application health
curl http://localhost:5000/health

# Admin metrics (development only)
curl http://localhost:5000/admin/metrics

# Database connectivity
npm run db:check
```

### Load Test Schedule
- **Weekly**: Run smoke test every Monday at 06:00 UTC
- **Pre-deployment**: Always run smoke test before production releases
- **Capacity Planning**: Full load test monthly (first Friday of month)

### Performance Baselines
- **Concurrent Users**: Support 100 simultaneous users
- **Peak Load**: Handle 2x normal traffic for 1 hour
- **Sync Throughput**: 500 batch operations per minute
- **Question Generation**: 50 concurrent AI requests

---

## 🔄 Incident Response Procedures

### Severity Classification

#### Severity 1 (Critical)
- Complete service outage
- Data corruption affecting multiple users
- Security breach or data leak
- **Response Time**: 15 minutes
- **Resolution Target**: 4 hours

#### Severity 2 (High)
- Significant service degradation
- Core features unavailable
- Authentication issues
- **Response Time**: 30 minutes
- **Resolution Target**: 8 hours

#### Severity 3 (Medium)
- Partial feature degradation
- Performance issues
- Non-critical feature failures
- **Response Time**: 2 hours
- **Resolution Target**: 24 hours

#### Severity 4 (Low)
- Minor issues not affecting core functionality
- Documentation updates needed
- Enhancement requests
- **Response Time**: 1 business day
- **Resolution Target**: 1 week

### Incident Response Steps

#### 1. Detection & Triage (0-15 minutes)
- [ ] Acknowledge alert
- [ ] Assess severity and impact
- [ ] Assign incident commander
- [ ] Create incident ticket
- [ ] Notify stakeholders if Sev 1-2

#### 2. Investigation & Mitigation (15 minutes - 4 hours)
- [ ] Gather logs and metrics
- [ ] Identify root cause
- [ ] Implement immediate workaround if possible
- [ ] Escalate if needed
- [ ] Provide regular status updates

#### 3. Resolution & Recovery
- [ ] Apply permanent fix
- [ ] Verify system stability
- [ ] Monitor for regression
- [ ] Update incident ticket
- [ ] Communicate resolution

#### 4. Post-Incident Review
- [ ] Conduct post-mortem within 48 hours
- [ ] Document lessons learned
- [ ] Create action items for prevention
- [ ] Update procedures if needed

---

## 📈 Operational Metrics Dashboard

### Key Performance Indicators (KPIs)

#### System Health
- **Uptime**: 99.5% target (measured monthly)
- **Error Rate**: < 1% of all requests
- **Response Time**: P95 < 2000ms for sync operations
- **Throughput**: 1000+ requests per minute peak capacity

#### User Experience
- **Sync Success Rate**: > 99.5%
- **Authentication Success**: > 99.8%
- **Feature Availability**: Core features 99.9% uptime
- **Client Error Rate**: < 5% (mostly user input validation)

#### Resource Utilization
- **CPU Usage**: < 70% average, < 90% peak
- **Memory Usage**: < 80% average, < 95% peak
- **Disk Usage**: < 80% (triggers cleanup procedures)
- **Network I/O**: Monitor for unusual patterns

### Metrics Collection
- **Structured Logs**: JSON format with request IDs
- **SLO Tracking**: Rolling window percentile calculations
- **Real-time Metrics**: Updated every 60 seconds
- **Historical Data**: Retained for 90 days

---

## 🛠️ Maintenance Procedures

### Routine Maintenance Schedule

#### Daily (Automated)
- Backup creation and verification
- Log rotation and cleanup
- Health check verification
- Security scan results review

#### Weekly (Manual)
- Load smoke test execution
- Dependency update review
- Security patch assessment
- Performance trend analysis

#### Monthly (Planned)
- Full system load test
- Disaster recovery drill
- Security audit review
- Capacity planning assessment

### Deployment Procedures

#### Pre-deployment Checklist
- [ ] Code reviewed and approved
- [ ] Tests passing (unit, integration, smoke)
- [ ] Database migrations tested
- [ ] Backup created
- [ ] Rollback plan documented

#### Deployment Steps
1. **Prepare**: Create pre-deployment backup
2. **Deploy**: Apply changes with zero-downtime strategy
3. **Verify**: Run smoke test and health checks
4. **Monitor**: Watch metrics for 30 minutes
5. **Rollback**: If issues detected, execute rollback plan

#### Post-deployment
- [ ] Verify all features working
- [ ] Monitor error rates for 2 hours
- [ ] Update deployment documentation
- [ ] Notify team of successful deployment

### Security Maintenance
- **Dependency Updates**: Weekly security patch review
- **Access Audits**: Monthly user access review
- **Certificate Management**: 30-day expiration alerts
- **Security Scanning**: Daily automated scans

---

## 🔒 Security Incident Response

### Security Incident Classification

#### Critical Security Incidents
- Active data breach
- Unauthorized system access
- Malware detection
- **Response Time**: Immediate (5 minutes)

#### High Security Incidents
- Suspicious access patterns
- Failed authentication spikes
- Vulnerability exploitation attempts
- **Response Time**: 30 minutes

### Security Response Steps
1. **Isolate**: Contain the potential breach
2. **Assess**: Determine scope and impact
3. **Notify**: Contact security team immediately
4. **Document**: Log all actions taken
5. **Remediate**: Apply fixes and security patches
6. **Monitor**: Enhanced monitoring for 72 hours

### Security Contacts
- **Emergency Security Hotline**: security-emergency@learnoz.edu.au
- **Data Protection Officer**: dpo@learnoz.edu.au
- **Legal Team**: legal@learnoz.edu.au

---

## 📞 Communication Templates

### Status Page Updates

#### Investigating
```
We are currently investigating reports of [issue description]. 
Users may experience [specific impact]. We will provide updates 
every 30 minutes. 
Last updated: [timestamp]
```

#### Identified
```
We have identified the cause of [issue description] and are 
implementing a fix. Expected resolution time: [estimate].
Workaround: [if available]
Last updated: [timestamp]
```

#### Resolved
```
The issue with [issue description] has been resolved. All 
services are operating normally. We apologize for any 
inconvenience caused.
Last updated: [timestamp]
```

### User Communication

#### Planned Maintenance
```
Subject: Scheduled Maintenance - [Date] [Time]

Dear LearnOz Users,

We will be performing scheduled maintenance on [date] from 
[start time] to [end time] [timezone]. During this time:

- The application will remain accessible
- Some features may be temporarily unavailable
- No user data will be affected

We apologize for any inconvenience.

The LearnOz Team
```

#### Incident Notification
```
Subject: Service Issue - [Brief Description]

Dear LearnOz Users,

We are experiencing an issue with [description]. Our team is 
actively working on a resolution.

Impact: [what users can expect]
Expected Resolution: [time estimate]
Workaround: [if available]

We will provide updates at [url] and will notify you when 
the issue is resolved.

The LearnOz Team
```

---

## 📋 Daily Operations Checklist

### Morning Checks (Start of Business Day)
- [ ] Review overnight alerts and incidents
- [ ] Check backup success from previous night
- [ ] Verify application health status
- [ ] Review error rate trends
- [ ] Check resource utilization
- [ ] Scan security alerts

### Afternoon Checks (Mid-Day)
- [ ] Monitor sync operation performance
- [ ] Check authentication success rates
- [ ] Review user-reported issues
- [ ] Verify scheduled task completion
- [ ] Update incident tickets

### Evening Checks (End of Business Day)
- [ ] Prepare backup for tonight
- [ ] Review day's performance metrics
- [ ] Update on-call documentation
- [ ] Plan next day maintenance if needed
- [ ] Handoff any ongoing incidents

### Weekly Reviews
- [ ] Analyze performance trends
- [ ] Review incident patterns
- [ ] Update capacity planning
- [ ] Security patch assessment
- [ ] Team feedback and improvements

---

## 🔧 Troubleshooting Guide

### Common Issues

#### High Response Time
**Symptoms**: Sync operations taking > 3 seconds
**Causes**: Database load, memory pressure, network issues
**Investigation**:
```bash
# Check system resources
top
df -h
netstat -an | grep ESTABLISHED | wc -l

# Check application logs
tail -f .data/logs/app.log | grep "duration"

# Check database performance
npm run db:analyze
```

#### Authentication Failures
**Symptoms**: Users unable to log in
**Causes**: JWT issues, session store problems, network issues
**Investigation**:
```bash
# Check auth logs
grep "AUTH:" .data/logs/app.log | tail -20

# Verify JWT configuration
echo $JWT_SECRET | wc -c  # Should be > 32 characters

# Test auth endpoint
curl -X POST http://localhost:5000/api/dev/issue?email=test@example.com
```

#### Sync Errors
**Symptoms**: Batch sync operations failing
**Causes**: Validation errors, database issues, rate limiting
**Investigation**:
```bash
# Check sync performance
grep "SYNC:" .data/logs/app.log | tail -10

# Check rate limiting
grep "rate_limit" .data/logs/app.log | tail -5

# Test sync endpoint
curl -X POST http://localhost:5000/api/sync/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{"userId":"test","learnerId":"test","items":[]}'
```

### Recovery Procedures

#### Service Not Responding
1. Check if process is running: `ps aux | grep node`
2. Check port availability: `netstat -tlnp | grep 5000`
3. Restart service: `npm run dev` (development) or service restart (production)
4. Verify health: `curl http://localhost:5000/health`

#### Database Issues
1. Check database connectivity: `npm run db:check`
2. Check disk space: `df -h`
3. Review slow queries: `npm run db:analyze`
4. Restart database service if needed

#### Memory Issues
1. Check memory usage: `free -h`
2. Identify memory leaks: `ps aux --sort=-%mem | head`
3. Restart application to clear memory
4. Monitor for recurring issues

---

This runbook should be reviewed and updated monthly, or immediately after any major incident. All team members should be familiar with these procedures and practice them regularly during drills.

**Last Updated**: 2025-09-04  
**Next Review Date**: 2025-10-04  
**Document Owner**: Platform Team