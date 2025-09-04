# Classroom Management Guide

LearnOz provides comprehensive classroom tools for educators managing multiple students. This guide covers bulk roster import, class management, projector-safe presets, and parent reporting features.

## Table of Contents

1. [Bulk Roster Import](#bulk-roster-import)
2. [Class Code Management](#class-code-management)
3. [Projector-Safe Presets](#projector-safe-presets)
4. [Weekly Dashboard Reports](#weekly-dashboard-reports)
5. [Parent Summary Exports](#parent-summary-exports)
6. [Quick-Start for Classroom Devices](#quick-start-for-classroom-devices)

## Bulk Roster Import

### CSV Template Format

LearnOz supports bulk student import via CSV files. The required format is:

```csv
name,ageband,email
Student Name,primary,student@school.edu
Another Student,pre-primary,
Third Student,upper-primary,parent@example.com
```

#### Required Headers

- **name**: Student's full name (minimum 2 characters)
- **ageband**: Must be one of:
  - `pre-primary` (ages 4-5)
  - `primary` (ages 6-8) 
  - `upper-primary` (ages 9-12)

#### Optional Headers

- **email**: Contact email for parent notifications (optional)

### Import Validation

The system validates each row and provides detailed feedback:

#### Validation Rules

1. **Name Requirements**
   - Must be at least 2 characters long
   - Cannot be empty
   
2. **Age Band Requirements**
   - Must match exactly one of the three valid options
   - Case-sensitive
   
3. **Email Requirements** (if provided)
   - Must contain '@' symbol
   - Basic format validation

#### Error Handling

- **Row-level errors**: Invalid rows are flagged with specific error messages
- **Duplicate detection**: Warns about duplicate names but allows import
- **Partial imports**: Valid rows are imported even if some rows have errors
- **Error reporting**: Detailed report shows which rows failed and why

### Class Creation Process

1. **Upload CSV**: Select file via file picker
2. **Review validation**: Check for errors and warnings
3. **Name the class**: Provide a descriptive class name
4. **Confirm import**: Create class with valid students
5. **Receive class code**: 6-character alphanumeric code for easy access

### Best Practices

- **Test with small files first**: Start with 5-10 students to verify format
- **Use consistent naming**: Follow school naming conventions
- **Keep backups**: Save original roster files
- **Regular updates**: Re-import when student lists change

## Class Code Management

### Code Generation

- **Format**: 6-character alphanumeric codes (A-Z, 2-9)
- **Clarity**: Excludes confusing characters (O, 0, I, 1)
- **Uniqueness**: System ensures no duplicate codes
- **Examples**: `ABC234`, `XYZ789`, `MNP456`

### Code Distribution

1. **Teacher setup**: Create class and receive code
2. **Student access**: Students enter code on any device
3. **Instant join**: No additional setup required
4. **Cross-platform**: Works on tablets, laptops, and interactive whiteboards

### Code Security

- **Limited scope**: Codes only provide access to specific class
- **Teacher control**: Teachers can regenerate codes if needed
- **Safe sharing**: Codes can be written on whiteboards or shared verbally

## Projector-Safe Presets

### Purpose

Projector presets ensure comfortable viewing during whole-class instruction by:

- **Increasing font sizes** for better visibility from distance
- **Hiding student names** to protect privacy during demonstrations
- **Optimizing contrast** for projector display quality
- **Removing distractions** that aren't relevant for whole-class viewing

### Preset Options

#### Font Scaling
- **125%**: Slightly larger text for small projectors
- **150%**: Standard classroom projector size
- **200%**: Large lecture halls or poor visibility conditions

#### Privacy Settings
- **Hide Names**: Replaces student names with "Student" or generic identifiers
- **Show Initials**: Shows only first name initial
- **Full Names**: Normal display (not recommended for projection)

#### Visual Adjustments
- **High Contrast**: Enhanced text contrast for projector clarity
- **Simplified UI**: Removes non-essential interface elements
- **Focus Mode**: Highlights active content area

### Activation Methods

1. **Manual Toggle**: Teacher activates from classroom settings
2. **Class Code Entry**: Automatically enabled when students join via class code
3. **Device Detection**: Can auto-detect when connected to projector (if supported)

### What Gets Hidden

When privacy mode is active:
- Student names in progress displays
- Individual performance metrics
- Personal avatar displays
- Chat or communication features
- Sensitive assignment feedback

### What Remains Visible

Essential teaching content:
- Lesson content and instructions
- Group progress indicators
- Shared learning materials
- Timer and session information
- General class statistics

## Weekly Dashboard Reports

### Report Generation

Reports are automatically generated every Monday for the previous week and include:

#### Class-Level Metrics
- **Total active minutes**: Sum of all student on-task time
- **Total sessions**: Count of distinct learning sessions
- **Assignment completion**: Lessons completed during the week
- **Due soon/overdue**: Upcoming assignment status

#### Per-Student Breakdown
- **Individual minutes**: On-task time per student
- **Session count**: Learning sessions per student
- **Completion status**: Assignments finished by each student
- **Engagement patterns**: Daily activity distribution

### Metric Definitions

#### Active Minutes
- **Primary source**: On-task tracking system
- **Fallback calculation**: Lesson duration estimates
- **Exclusions**: Idle time, menu navigation, setup time
- **Accuracy**: ±2 minutes due to session boundary detection

#### Learning Sessions
- **Definition**: Continuous activity with <30 minute gaps
- **Triggers**: Lesson starts, journal entries, practice activities
- **Grouping**: Related activities within time window count as one session
- **Cross-day sessions**: Break at midnight regardless of activity

#### Assignment Tracking
- **Completion detection**: Based on lesson finish events with 'pass' result
- **Due date warnings**: 
  - *Due soon*: Within 48 hours
  - *Overdue*: Past due date
- **Week attribution**: Assignments completed during report week

### Data Sources

#### Primary Data
- **Progress events**: Lesson completions, journal entries, activity starts
- **On-task tracking**: Real-time engagement monitoring
- **Assignment system**: Due dates, completion status, lesson associations

#### Fallback Systems
- **Duration estimates**: Default lesson times when tracking unavailable
- **Event-based calculation**: Activity timestamps for session detection
- **Assignment inference**: Lesson completion patterns

### Export Options

- **PDF format**: Printable class summary
- **CSV export**: Raw data for further analysis
- **Email digest**: Automated weekly delivery (if configured)

## Parent Summary Exports

### Individual Reports

Each student gets a personalized weekly report containing:

#### Accomplishments Section
- **Lessons completed**: Subject area, lesson name, completion date
- **Practice sessions**: Journal entries and skill practice
- **Scout tips used**: AI assistance interactions
- **Active learning time**: Total minutes engaged

#### Progress Indicators
- **Learning streak**: Consecutive days with activity
- **Subject distribution**: Progress across literacy, math, science, HASS
- **Skill development**: Areas of focus and improvement

#### Assignment Status
- **Recently completed**: Lessons finished during the week
- **Coming up**: Next 5 assignments with due dates
- **Overdue items**: Past-due assignments requiring attention

### Print Optimization

#### Layout Design
- **A4 page size**: Standard 8.5" x 11" formatting
- **Single page**: All essential information fits on one page
- **Print margins**: 1-inch margins on all sides
- **Font sizes**: 11-12pt for body text, larger for headings

#### Stylesheet Features
- **Print-specific CSS**: Optimized for paper output
- **Grayscale friendly**: High contrast for black-and-white printing
- **Page breaks**: Prevents awkward content splitting
- **Print buttons**: Hidden in print output

#### Browser Compatibility
- **Print dialog**: Uses native browser print functionality
- **PDF option**: "Save as PDF" available in all modern browsers
- **Background graphics**: Instructions for enabling school/district logos

### Content Guidelines

#### Positive Framing
- **Celebration focus**: Highlights achievements and progress
- **Constructive insights**: Gentle guidance for improvement areas
- **Encouragement**: Motivational language for continued learning

#### Parent-Friendly Language
- **Plain English**: Avoids educational jargon
- **Clear metrics**: Easy-to-understand progress indicators
- **Actionable insights**: Specific suggestions for home support

#### Privacy Protection
- **Individual focus**: No comparison to other students
- **Appropriate detail**: Learning-relevant information only
- **Secure distribution**: Teacher-controlled access and distribution

### QR Code Integration

Each report includes a QR code linking to:
- **LearnOz homepage**: Quick access for parents
- **80x80 pixel size**: Scannable but not intrusive
- **Error correction**: Robust encoding for reliable scanning

## Quick-Start for Classroom Devices

### Streamlined Setup

The quick-start feature enables fast classroom device preparation:

#### Class Mode Entry
- **Prominent display**: Large, visible "Join Class" button
- **Single input**: Just the 6-character class code
- **Auto-configure**: Applies projector presets automatically
- **Bulk setup**: Teacher can prepare multiple devices quickly

#### Device Types Supported
- **Tablets**: iPad, Android tablets, Windows tablets
- **Laptops**: Windows, Mac, Chromebook
- **Interactive whiteboards**: Smart boards, Promethean panels
- **Shared computers**: Library computers, computer lab stations

### Setup Process

1. **Display class code**: Teacher shares 6-character code
2. **Navigate to LearnOz**: Students go to app homepage
3. **Enter class mode**: Tap/click "Join Class" button
4. **Input code**: Type the 6-character code
5. **Automatic setup**: Device configures for classroom use

### Classroom Optimizations

When devices join via class code:

#### Automatic Configurations
- **Projector presets**: Font scaling and privacy settings activated
- **Distraction reduction**: Non-essential features hidden
- **Focus mode**: Streamlined interface for learning content
- **Session persistence**: Settings remain until manual logout

#### Teacher Controls
- **Mass logout**: Teacher can end all class sessions
- **Settings override**: Adjust presets for specific activities
- **Session monitoring**: See which devices are connected
- **Quick resets**: Restart class session if needed

### Troubleshooting

#### Common Issues
- **Invalid code**: Check for typos, ensure code is active
- **Device compatibility**: Verify browser version and internet connection
- **Display issues**: Confirm projector preset settings
- **Access problems**: Ensure school network allows LearnOz access

#### Solutions
- **Code verification**: Teacher can regenerate if needed
- **Browser updates**: Use current Chrome, Firefox, Safari, or Edge
- **Network settings**: Work with IT to whitelist LearnOz domains
- **Alternative access**: Direct URL entry if button unavailable

## Integration with School Systems

### Single Sign-On (SSO)
- **Google Classroom**: Integration with existing class rosters
- **Microsoft Teams**: Sync with school Office 365 accounts
- **Canvas/Blackboard**: Assignment gradebook integration
- **Student Information Systems**: Bulk import from SIS exports

### Data Privacy
- **COPPA compliance**: Child privacy protection
- **FERPA alignment**: Educational record confidentiality
- **Local storage**: Data remains on school devices when possible
- **Minimal collection**: Only essential learning data gathered

### Technical Requirements
- **Internet connection**: Broadband recommended for video content
- **Browser requirements**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Device specs**: 2GB RAM minimum, 4GB recommended
- **Storage**: 100MB local storage for offline capability

## Support and Training

### Teacher Resources
- **Video tutorials**: Step-by-step setup guides
- **PDF quick guides**: Printable reference cards
- **Webinar training**: Live training sessions
- **Email support**: Direct access to education specialists

### Student Resources
- **Age-appropriate guides**: Simple setup instructions
- **Visual aids**: Screenshots and diagrams
- **Peer helpers**: Student tech team training
- **Troubleshooting**: Common issue solutions

### Administrator Tools
- **Bulk management**: District-wide class creation
- **Usage analytics**: Adoption and engagement metrics
- **Policy controls**: Content filtering and access restrictions
- **Billing integration**: Subscription management tools