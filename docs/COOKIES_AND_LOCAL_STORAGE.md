# Cookies and Local Storage - LearnOz

*Complete inventory of browser storage used for educational functionality*

## Our Privacy-First Approach

LearnOz is designed to minimize tracking and protect student privacy:

✅ **No Third-Party Cookies**: We don't use advertising or social media cookies
✅ **No Cross-Site Tracking**: No data sharing with external analytics or marketing platforms  
✅ **Local-First Storage**: Most data stays on your device and can be deleted anytime
✅ **Functional Only**: Browser storage used only for essential educational features

## Local Storage Inventory

*Local Storage persists until manually cleared or app uninstalled*

### Learning Progress and Personalization
| Key | Purpose | Data Type | Retention |
|-----|---------|-----------|-----------|
| `qi.loop` | Current lesson progress | Lesson IDs, completion status | Until lesson finished |
| `qi.comp` | Completed lessons history | Achievement list, timestamps | 1 year |
| `qi.bp_items` | Learning tools collected | Backpack inventory | Until manually cleared |
| `qi.bp_equipped` | Active learning tools | Current tool selection | Session-based |
| `qi.last` | Resume previous lesson | Last lesson ID, progress position | Until new lesson started |

### User Preferences and Settings  
| Key | Purpose | Data Type | Retention |
|-----|---------|-----------|-----------|
| `qi.teacher` | Teacher mode status | Boolean flag | Until manually disabled |
| `qi.framework` | Curriculum framework | Standards selection | Until changed |
| `qi.calm` | Calm mode preference | Boolean flag | Until manually changed |
| `qi.proto_only` | Prototype mode setting | Boolean flag | Until manually changed |
| `qi_loop` | Learning loop state | Current activity state | Session-based |

### Accessibility and Display
| Key | Purpose | Data Type | Retention |
|-----|---------|-----------|-----------|
| `qi.projector` | Projector mode settings | Display preferences | Until manually disabled |
| `qi.font_size` | Text size preference | Scaling percentage | Until manually changed |
| `qi.contrast` | High contrast mode | Boolean flag | Until manually changed |
| `qi.motion` | Reduced motion setting | Boolean flag | Until manually changed |

### Feature Flags and Development
| Key | Purpose | Data Type | Retention |
|-----|---------|-----------|-----------|
| `qi.features.*` | Feature toggle states | Boolean flags | Development only |
| `qi.debug.*` | Debug mode settings | Development flags | Development only |
| `qi.qa.*` | Quality assurance tools | Testing configurations | Development only |

*Note: Feature flag storage is only active in development environments and not present in production builds*

## Session Storage Inventory

*Session Storage clears when browser tab closes*

### Temporary Learning State
| Key | Purpose | Data Type | Session Scope |
|-----|---------|-----------|---------------|
| `qi.session_id` | Current learning session | Unique identifier | Single browser tab |
| `qi.active_lesson` | Current lesson state | Lesson progress data | Single learning session |
| `qi.temp_answers` | Unsaved work | Draft responses | Until saved or tab closed |

### Authentication and Security
| Key | Purpose | Data Type | Session Scope |
|-----|---------|-----------|---------------|
| `qi.auth_token` | Classroom authentication | Encrypted session token | Single browser session |
| `qi.csrf_token` | Security protection | Anti-forgery token | Single page load |

## Essential Cookies

*LearnOz uses minimal essential cookies for core functionality*

### Authentication Cookies
| Name | Purpose | Duration | Domain |
|------|---------|----------|--------|
| `qi_session` | Classroom login session | 24 hours | Same-site only |
| `qi_csrf` | Security token | 1 hour | Same-site only |

### Functional Cookies  
| Name | Purpose | Duration | Domain |
|------|---------|----------|--------|
| `qi_timezone` | School timezone detection | 1 year | Same-site only |
| `qi_lang` | Language preference | 1 year | Same-site only |

**Cookie Properties**:
- `Secure`: Yes (HTTPS only)
- `HttpOnly`: Yes (no JavaScript access)  
- `SameSite`: Strict (no cross-site sharing)

## What We DON'T Use

### No Advertising Technology
- **No tracking pixels** or web beacons
- **No advertising cookies** from Google, Facebook, or other platforms
- **No behavioral profiling** for commercial purposes
- **No cross-site tracking** or fingerprinting

### No Third-Party Analytics  
- **No Google Analytics** or similar tracking services
- **No social media plugins** that track users
- **No marketing automation** or email tracking
- **No affiliate tracking** or referral cookies

### No Persistent Device Tracking
- **No device fingerprinting** for tracking across sessions
- **No browser fingerprinting** using canvas, audio, or hardware features
- **No location tracking** or geolocation services
- **No contact or calendar access** on mobile devices

## Data Control and Deletion

### How to Clear Your Data

#### Browser Settings Method
1. **Chrome**: Settings → Privacy & Security → Clear Browsing Data → Cookies and Site Data
2. **Firefox**: Settings → Privacy & Security → Cookies and Site Data → Clear Data  
3. **Safari**: Settings → Privacy → Manage Website Data → Remove All
4. **Edge**: Settings → Privacy & Security → Clear Browsing Data → Cookies

#### LearnOz Built-in Controls
- **Teacher Panel**: Settings → Privacy & Data → Clear Local Data
- **Student Reset**: Backpack → Settings → Reset Progress (requires adult verification)
- **Full Reset**: Contact teacher or parent for complete data removal

### What Happens When You Clear Data
- **Learning Progress**: Reset to beginning (can be restored from cloud backup if enabled)
- **Preferences**: Return to default settings
- **Tools and Items**: Backpack inventory cleared
- **Authentication**: Logged out, need to re-enter class code

## Privacy for Different Users

### Students (Under 13)
- **Minimal Data**: Only essential learning progress stored locally
- **No Tracking**: No cross-site or behavioral tracking of any kind
- **Parent Control**: Parents can clear all data through teacher
- **School Oversight**: Teachers can monitor and control data collection

### Students (13-18)  
- **Educational Focus**: Data collection limited to learning objectives
- **Transparency**: Clear explanation of what data is stored and why
- **Control Options**: Can clear own data with appropriate safeguards
- **Privacy Rights**: Full transparency about data practices

### Teachers and Adults
- **Professional Data**: Additional classroom management data stored
- **Audit Logs**: Access to student data usage for educational oversight
- **Privacy Controls**: Can manage data collection for entire classes
- **Compliance Tools**: Access to data export and deletion tools

## Compliance and Legal Basis

### COPPA Compliance (US Children Under 13)
- **No Behavioral Advertising**: No tracking for commercial purposes
- **Educational Purpose**: All data collection for educational objectives only
- **School Authorization**: Collection authorized by school for educational activities
- **Parent Rights**: Parents can review and delete child's data through school

### FERPA Compliance (US Educational Records)
- **Educational Records**: Local storage data may be considered educational records
- **School Official**: LearnOz operates as school official with legitimate educational interest
- **Parent Rights**: Parents have rights to inspect and request deletion of educational records

### GDPR Compliance (EU Data Protection)
- **Lawful Basis**: Processing based on public task (education) and legitimate interests
- **Data Subject Rights**: Full transparency and control over personal data
- **Data Minimization**: Collect only data necessary for educational purposes
- **Child Protection**: Enhanced protections for children's personal data

## Technical Implementation

### Storage Security
- **Encryption**: Sensitive local data encrypted with device-specific keys
- **Integrity Checks**: Detection of unauthorized modification of stored data
- **Access Controls**: Storage access limited to LearnOz application only
- **Secure Deletion**: Cryptographic wiping when data is deleted

### Privacy by Design
- **Default Privacy**: Most privacy-protective settings enabled by default
- **Data Minimization**: Collect only data essential for educational functionality  
- **Purpose Limitation**: Use data only for stated educational purposes
- **Transparency**: Clear documentation of all data practices

---

**Storage Questions**: For technical questions about browser storage, contact support through your teacher or school administrator.

**Privacy Concerns**: For privacy-related questions, contact your school's privacy coordinator or data protection officer.

**Parent Rights**: Parents seeking to exercise data rights should contact their child's teacher or school administration.

*This inventory covers all browser storage used by LearnOz. We commit to updating this documentation whenever new storage mechanisms are introduced.*

*Last updated: January 2025*