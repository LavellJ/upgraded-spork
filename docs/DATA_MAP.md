# Data Map - LearnOz

*Comprehensive mapping of personal data collection, processing, and storage*

## Data Categories Overview

| Category | Data Elements | Purpose | Retention | Encryption |
|----------|---------------|---------|-----------|------------|
| Student Identity | Names, Student IDs, Class Assignments | Educational record keeping | Academic year + 1 year | AES-256 |
| Learning Progress | Lesson completion, scores, learning paths | Personalized instruction | 3 years or graduation | AES-256 |
| Behavioral Analytics | Time-on-task, engagement patterns, help-seeking | Learning optimization | 1 year | AES-256 |
| Technical Logs | Device IDs, IP addresses, error logs | System maintenance | 90 days | AES-256 |
| Optional Feedback | Surveys, bug reports, suggestions | Product improvement | 2 years or consent withdrawal | AES-256 |

## Detailed Data Inventory

### Student Learning Records

#### Core Academic Data
**Database**: `learner_progress`
- `student_id` (encrypted): Unique identifier linked to school systems
- `lesson_id`: Curriculum content identifier  
- `completion_date`: When lesson was finished
- `performance_score`: Normalized learning outcome measure (0-100)
- `attempt_count`: Number of tries to complete lesson
- `time_spent_minutes`: Actual learning time (excluding idle time)

**Storage Location**: Primary database (EU-West region)
**Backup Location**: Encrypted backups (EU-Central region)
**Retention**: 3 years from student graduation or program exit

#### Learning Analytics
**Database**: `engagement_metrics`
- `session_id` (encrypted): Individual learning session identifier
- `activity_timestamps`: Start/end times for learning activities
- `interaction_events`: Clicks, navigation, help requests (no content)
- `focus_indicators`: Window focus, idle detection, multitasking patterns
- `accessibility_usage`: Screen reader, font adjustments, input accommodations

**Storage Location**: Analytics database (EU-West region)  
**Backup Location**: Data warehouse (EU-Central region)
**Retention**: 1 year from collection date

#### Student-Generated Content
**Database**: `journal_entries`
- `entry_id` (encrypted): Unique reflection identifier
- `content_hash`: One-way hash of student writing (for plagiarism detection)
- `topic_tags`: Curriculum alignment markers
- `word_count`: Length indicator for progress tracking
- `creation_date`: When reflection was written

**Storage Location**: Content database (EU-West region)
**Backup Location**: Encrypted content archive (EU-Central region)  
**Retention**: 2 years or until student/parent requests deletion

### Teacher and Classroom Data

#### Professional Information
**Database**: `teacher_profiles`
- `teacher_id` (encrypted): Unique educator identifier
- `email_hash`: One-way hash of email address for communication
- `school_id`: Institution identifier
- `grade_levels`: Teaching assignments and subject areas
- `class_rosters`: Student group memberships

**Storage Location**: User management database (EU-West region)
**Backup Location**: Identity backup system (EU-Central region)
**Retention**: Employment period + 1 year

#### Instructional Data  
**Database**: `teaching_analytics`
- `assignment_created`: Dates and curriculum choices
- `progress_reviews`: Frequency of student progress monitoring
- `intervention_actions`: Help provided to struggling students (no personal details)
- `professional_development`: Training completions and certifications

**Storage Location**: Professional database (EU-West region)
**Backup Location**: Training archive (EU-Central region)
**Retention**: 3 years from teaching assignment end

### System and Technical Data

#### Authentication and Access
**Database**: `auth_sessions`
- `session_token` (encrypted): Temporary access credential
- `login_timestamp`: Authentication event time
- `ip_address_hash`: One-way hash of network location
- `device_fingerprint`: Browser/device configuration (no tracking)
- `access_duration`: Length of authenticated session

**Storage Location**: Security database (EU-West region)
**Backup Location**: Security audit logs (EU-Central region)
**Retention**: 90 days from session end

#### Error and Performance Logs
**Database**: `system_diagnostics`
- `error_id`: Technical issue identifier
- `error_type`: Category of technical problem
- `performance_metrics`: Load times, response rates (no personal data)
- `feature_usage`: Adoption patterns for new capabilities
- `support_requests`: Technical assistance provided (anonymized)

**Storage Location**: Operations database (EU-West region)
**Backup Location**: Operations archive (EU-Central region)
**Retention**: 1 year from log creation

### Optional Research and Feedback

#### Voluntary Surveys
**Database**: `feedback_responses`
- `response_id` (encrypted): Anonymous survey identifier
- `satisfaction_scores`: Numerical ratings for learning experience
- `feature_preferences`: Usage patterns and improvement suggestions
- `demographic_indicators`: Age group, grade level (no personal identifiers)
- `consent_status`: Permission level for different uses

**Storage Location**: Research database (EU-West region)
**Backup Location**: Research archive (EU-Central region)
**Retention**: 2 years or until consent withdrawal

## Data Flow Mapping

### Collection Points
1. **Direct Input**: Student learning activities, teacher assignments, manual data entry
2. **System Generated**: Performance calculations, time tracking, engagement metrics
3. **Device Sensors**: Accessibility settings, display preferences, input methods
4. **Network Logs**: Authentication events, error conditions, performance monitoring

### Processing Activities  
1. **Real-Time**: Learning recommendations, progress tracking, personalization
2. **Batch Analytics**: Weekly reports, trend analysis, curriculum effectiveness
3. **Machine Learning**: Adaptive learning paths, early intervention identification
4. **Reporting**: Parent summaries, teacher dashboards, administrative analytics

### Data Recipients
1. **Primary Users**: Students, parents, teachers, school administrators
2. **Technical Support**: LearnOz support staff (encrypted data only)
3. **Service Providers**: Cloud hosting, backup services (processor agreements)
4. **Regulators**: Education authorities, data protection officers (upon lawful request)

## Geographic Data Storage

### Primary Infrastructure
**Region**: EU-West (Ireland, Netherlands)
- Live application databases
- Real-time analytics processing
- Active user authentication
- Current backup systems

### Secondary Infrastructure  
**Region**: EU-Central (Germany, France)
- Long-term data archives
- Disaster recovery systems
- Compliance audit trails
- Historical analytics warehouse

### Data Residency Compliance
- **GDPR**: All EU student data remains within EU/EEA
- **National Laws**: Compliance with member state data localization requirements
- **Cross-Border**: No transfers to third countries without adequate protection

## Encryption and Security Details

### Encryption at Rest
- **Algorithm**: AES-256-GCM with hardware security modules
- **Key Management**: Rotating encryption keys with 90-day lifecycle
- **Database**: Transparent data encryption (TDE) for all personal data columns
- **Backups**: Encrypted with separate key hierarchy

### Encryption in Transit
- **Protocol**: TLS 1.3 with perfect forward secrecy
- **Certificates**: Extended validation certificates with certificate pinning
- **API Communications**: Mutual TLS authentication for service-to-service
- **Client Connections**: HSTS and certificate transparency monitoring

### Access Controls
- **Authentication**: Multi-factor authentication for all administrative access
- **Authorization**: Role-based access control with principle of least privilege
- **Audit Logging**: Complete access logs with tamper-evident storage
- **Session Management**: Automatic timeout and concurrent session limits

## Data Retention Policies

### Automatic Deletion Triggers
1. **Student Graduation**: Personal data deleted 3 years after program completion
2. **Consent Withdrawal**: Optional data deleted within 30 days
3. **Account Closure**: All personal data deleted within 90 days
4. **System Logs**: Technical data deleted after 90 days
5. **Feedback Data**: Research data deleted after 2 years or consent withdrawal

### Manual Deletion Processes
1. **Data Subject Requests**: Individual deletion within 30 days
2. **School Transfers**: Data export and deletion upon student transfer
3. **Program Termination**: Bulk deletion when school ends program
4. **Legal Holds**: Suspension of deletion for legal proceedings

### Archive and Backup Management
- **Backup Retention**: Encrypted backups retained for 1 year maximum
- **Archive Policies**: Long-term archives for compliance and audit (anonymized)
- **Deletion Verification**: Cryptographic proof of successful data deletion
- **Recovery Testing**: Regular testing of backup and deletion procedures

---

**Data Inventory Updates**: This mapping is reviewed quarterly and updated whenever new data collection is introduced.

**Access Requests**: For detailed information about specific data processing, contact your school's data protection officer.

**Technical Questions**: For information about security controls and data handling, contact support through your educational institution.

*This data map reflects current processing activities. Schools should maintain their own data inventory including local processing and additional systems.*

*Last updated: January 2025*