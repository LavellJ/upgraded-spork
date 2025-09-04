# Reports and Analytics Guide

LearnOz generates comprehensive reports to track student progress, class performance, and learning outcomes. This guide explains all metrics, calculations, and export options available to educators and administrators.

## Table of Contents

1. [Metric Definitions](#metric-definitions)
2. [Weekly Class Reports](#weekly-class-reports)
3. [Parent Summary Reports](#parent-summary-reports)
4. [Data Export Formats](#data-export-formats)
5. [Calculation Methods](#calculation-methods)
6. [Data Sources and Accuracy](#data-sources-and-accuracy)

## Metric Definitions

### Learning Time Metrics

#### Active Minutes
- **Definition**: Time spent actively engaged with learning content
- **Includes**: Lesson completion, journal writing, practice activities, problem-solving
- **Excludes**: Menu navigation, idle time, breaks, setup/login time
- **Calculation**: Sum of on-task tracking periods with idle time removed
- **Accuracy**: ±2 minutes due to session boundary detection and network delays

#### Session Count
- **Definition**: Distinct periods of continuous learning activity
- **Session boundary**: Activities separated by more than 30 minutes
- **Cross-day handling**: Sessions automatically end at midnight
- **Minimum duration**: Sessions must include at least one completed activity
- **Use case**: Indicates consistency and engagement patterns

#### On-Task Percentage
- **Definition**: Proportion of session time spent on learning activities
- **Calculation**: (Active minutes ÷ Total session time) × 100
- **Tracking method**: Real-time engagement monitoring
- **Baseline**: Measured against similar age groups
- **Threshold**: >70% considered highly engaged

### Academic Progress Metrics

#### Lessons Completed
- **Definition**: Successfully finished lesson modules with passing result
- **Pass criteria**: Varies by lesson type, typically 70-80% accuracy
- **Retry handling**: Only final successful completion counted
- **Subject breakdown**: Tracked separately for Literacy, Math, Science, HASS
- **Skill mapping**: Linked to Australian Curriculum standards

#### Journal Sessions
- **Definition**: Completed reflection and practice activities
- **Duration tracking**: Time from start to submission
- **Quality indicators**: Word count, engagement metrics, thoughtfulness
- **Skill development**: Metacognitive and writing skill assessment
- **Frequency**: Recommended 2-3 times per week

#### Scout Tips Used
- **Definition**: AI assistant interactions for learning support
- **Categories**: Hints, explanations, examples, encouragement
- **Effectiveness tracking**: Whether tip led to successful completion
- **Independence measure**: Decreasing usage over time indicates growing confidence
- **Support indicator**: High usage may indicate need for additional help

### Assignment and Assessment Metrics

#### Assignments Completed
- **Definition**: Teacher-assigned lessons finished during specified time period
- **Due date tracking**: Completion relative to assignment due dates
- **Quality assessment**: Pass/fail status and accuracy scores
- **Time attribution**: Counted in week when completed, not assigned
- **Grade integration**: Compatible with school gradebook systems

#### Due Soon Count
- **Definition**: Assignments due within the next 48 hours
- **Warning system**: Helps prioritize upcoming work
- **Auto-calculation**: Updated daily based on current date
- **Parent notification**: Included in weekly summary reports
- **Teacher alerts**: Dashboard warnings for class management

#### Overdue Count
- **Definition**: Assignments past their due date without completion
- **Grace period**: No grace period; overdue immediately after due time
- **Escalation**: Automatic notifications to teachers and parents
- **Recovery tracking**: Monitor completion of overdue items
- **Academic impact**: May affect overall progress assessments

### Engagement and Motivation Metrics

#### Learning Streak
- **Definition**: Consecutive days with at least one learning activity
- **Activity threshold**: Minimum one lesson or journal completion
- **Break conditions**: Streak breaks after 24 hours without activity
- **Weekend handling**: Configurable to include/exclude weekends
- **Motivation tool**: Gamification element to encourage consistency

#### Biome Progress
- **Forest (Literacy)**: Reading, writing, language skills
- **Desert (Math)**: Number, algebra, geometry, statistics
- **Ocean (Science)**: Physical, chemical, biological, earth sciences
- **Night (HASS)**: History, geography, civics, economics

#### Skill Tree Advancement
- **Prerequisites**: Skills must be mastered in sequence
- **Mastery criteria**: Multiple successful completions required
- **Visual progress**: Animated skill tree shows advancement
- **Branching paths**: Multiple routes through curriculum content
- **Assessment alignment**: Mapped to standardized assessment frameworks

## Weekly Class Reports

### Report Structure

Weekly reports provide comprehensive class performance overview:

#### Header Information
- **Report period**: Monday to Sunday date range
- **Class identification**: Class name, teacher, student count
- **Generation date**: When report was created
- **Summary statistics**: Key metrics at-a-glance

#### Class Totals Section
```
Total Active Minutes: Sum of all student on-task time
Total Sessions: Count of all learning sessions
Assignments Completed: Class-wide lesson completions
Due Soon: Assignments approaching deadline
Overdue: Past-due assignments requiring attention
```

#### Per-Student Breakdown
```
Student Name | Minutes | Sessions | Completed | Due Soon | Overdue
Alice Smith  |    45   |    3     |     2     |    1     |    0
Bob Johnson  |    32   |    2     |     1     |    2     |    1
...
```

### Data Aggregation

#### Time Period Definition
- **Week start**: Monday at 00:00:00 local time
- **Week end**: Sunday at 23:59:59 local time
- **Timezone handling**: Uses school's local timezone
- **Holiday consideration**: All days included regardless of school schedule

#### Student Inclusion
- **Active students**: Students with any activity during reporting period
- **Inactive students**: Listed with zero metrics for completeness
- **New students**: Included from their first day of activity
- **Transferred students**: Excluded after transfer date

#### Calculation Timing
- **Generation schedule**: Every Monday at 6:00 AM local time
- **Data cutoff**: Previous Sunday at midnight
- **Processing time**: Reports available by 7:00 AM Monday
- **Update frequency**: Reports are not updated after initial generation

### Export Options

#### PDF Format
- **Page layout**: Landscape orientation for table visibility
- **Font size**: 10pt body text, 12pt headers for readability
- **Color scheme**: Grayscale-friendly for printing
- **File naming**: `ClassReport_ClassName_WeekOf_YYYY-MM-DD.pdf`

#### CSV Format
- **Column headers**: Machine-readable field names
- **Data format**: Numeric values for easy analysis
- **Date format**: ISO 8601 standard (YYYY-MM-DD)
- **Encoding**: UTF-8 for international character support

#### Email Delivery
- **Schedule**: Optional automated Monday morning delivery
- **Recipients**: Teacher, administrator, specified staff
- **Format options**: PDF attachment or CSV data
- **Bounce handling**: Retry delivery and log failures

## Parent Summary Reports

### Individual Student Reports

Each student receives a personalized weekly summary:

#### Accomplishments Highlighting
- **Positive framing**: Focus on achievements and progress
- **Specific details**: Lesson names, completion dates, subject areas
- **Growth indicators**: Improvement from previous weeks
- **Celebration elements**: Milestones and significant achievements

#### Subject Area Breakdown
```
Literacy (Forest):
- Completed: Reading Comprehension Basics (Jan 15)
- Completed: Creative Writing Introduction (Jan 17)

Math (Desert):
- Completed: Addition Strategies (Jan 16)
- In Progress: Subtraction with Regrouping

Science (Ocean):
- No activity this week

HASS (Night):
- Completed: Community Helpers (Jan 18)
```

#### Insights and Recommendations
- **Learning patterns**: Best times of day for activity
- **Strength areas**: Subjects showing strong performance
- **Growth opportunities**: Areas needing additional support
- **Parent support suggestions**: Specific ways to help at home

### Print Optimization

#### Page Layout
- **Single page design**: All content fits on one 8.5" x 11" page
- **Margin settings**: 1-inch margins for standard printing
- **Font hierarchy**: Clear distinction between headers and body text
- **White space**: Adequate spacing for visual clarity

#### Content Organization
- **Grid layout**: Two-column design for efficient space usage
- **Visual elements**: QR codes, icons, and progress indicators
- **Print styles**: CSS optimized specifically for paper output
- **Page breaks**: Prevents awkward content splitting across pages

#### Accessibility Features
- **High contrast**: Black text on white background
- **Clear fonts**: Sans-serif fonts for easy reading
- **Logical order**: Content flows naturally for screen readers
- **Print instructions**: Guidance for optimal printing results

## Data Export Formats

### CSV Export Columns

#### Class Summary Export
```csv
week_start,class_name,student_count,total_minutes,total_sessions,assignments_completed,due_soon,overdue
2025-01-13,Grade 3A,25,450,45,38,12,3
```

#### Per-Student Detail Export
```csv
week_start,class_name,student_id,student_name,minutes,sessions,assignments_completed,due_soon,overdue,streak_days
2025-01-13,Grade 3A,learner_123,Alice Smith,45,3,2,1,0,7
2025-01-13,Grade 3A,learner_456,Bob Johnson,32,2,1,2,1,3
```

#### Lesson Completion Export
```csv
completion_date,student_id,student_name,lesson_id,biome,duration_minutes,result,attempts
2025-01-14,learner_123,Alice Smith,forest.reading.1,forest,8,pass,1
2025-01-15,learner_456,Bob Johnson,desert.math.1,desert,12,pass,2
```

### JSON API Format

For integration with school systems:

```json
{
  "reportPeriod": {
    "start": "2025-01-13",
    "end": "2025-01-19"
  },
  "classMetrics": {
    "className": "Grade 3A",
    "studentCount": 25,
    "totalMinutes": 450,
    "totalSessions": 45,
    "assignmentsCompleted": 38
  },
  "students": [
    {
      "id": "learner_123",
      "name": "Alice Smith",
      "metrics": {
        "minutes": 45,
        "sessions": 3,
        "assignmentsCompleted": 2,
        "dueSoon": 1,
        "overdue": 0,
        "streak": 7
      }
    }
  ]
}
```

### Excel Integration

- **Worksheet format**: Separate sheets for summary and detail data
- **Formulas**: Pre-built calculations for common analytics
- **Charts**: Automatic generation of progress charts
- **Pivot tables**: Ready-to-use data analysis tools
- **Conditional formatting**: Visual highlighting of key metrics

## Calculation Methods

### Active Time Calculation

#### Primary Method: On-Task Tracking
```javascript
// Pseudocode for on-task time calculation
function calculateActiveMinutes(learnerEvents, weekStart, weekEnd) {
  const onTaskTicks = getOnTaskTicks(learnerEvents, weekStart, weekEnd);
  let totalMinutes = 0;
  let sessionStart = null;
  let isIdle = false;

  for (const tick of onTaskTicks) {
    switch (tick.kind) {
      case 'start':
        sessionStart = tick.timestamp;
        isIdle = false;
        break;
      case 'idle':
        if (sessionStart && !isIdle) {
          totalMinutes += (tick.timestamp - sessionStart) / 60000;
        }
        isIdle = true;
        break;
      case 'resume':
        if (isIdle) {
          sessionStart = tick.timestamp;
          isIdle = false;
        }
        break;
      case 'stop':
        if (sessionStart && !isIdle) {
          totalMinutes += (tick.timestamp - sessionStart) / 60000;
        }
        sessionStart = null;
        isIdle = false;
        break;
    }
  }
  
  return Math.round(totalMinutes);
}
```

#### Fallback Method: Lesson Duration
```javascript
// Fallback when on-task data unavailable
function fallbackActiveMinutes(events) {
  let totalMinutes = 0;
  
  events.filter(e => e.kind === 'lesson_finish').forEach(event => {
    if (event.durationSec) {
      totalMinutes += event.durationSec / 60;
    } else {
      // Default estimates by lesson type
      totalMinutes += 8; // 8 minutes average lesson
    }
  });
  
  events.filter(e => e.kind === 'journal_finish').forEach(event => {
    if (event.durationSec) {
      totalMinutes += event.durationSec / 60;
    } else {
      totalMinutes += 5; // 5 minutes average journal
    }
  });
  
  return totalMinutes;
}
```

### Session Count Calculation

```javascript
function calculateSessionCount(events) {
  const activityEvents = events.filter(e => 
    e.kind === 'lesson_start' || e.kind === 'journal_start'
  ).sort((a, b) => a.timestamp - b.timestamp);
  
  if (activityEvents.length === 0) return 0;
  
  let sessions = 1;
  const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes
  
  for (let i = 1; i < activityEvents.length; i++) {
    const gap = activityEvents[i].timestamp - activityEvents[i-1].timestamp;
    if (gap > SESSION_GAP_MS) {
      sessions++;
    }
  }
  
  return sessions;
}
```

### Streak Calculation

```javascript
function calculateLearningStreak(allEvents) {
  const activityDates = allEvents
    .filter(e => e.kind === 'lesson_finish' || e.kind === 'journal_finish')
    .map(e => formatDate(e.timestamp, 'YYYY-MM-DD'))
    .filter((date, index, array) => array.indexOf(date) === index) // unique dates
    .sort();
  
  if (activityDates.length === 0) return 0;
  
  let currentStreak = 1;
  let maxStreak = 1;
  
  for (let i = 1; i < activityDates.length; i++) {
    const prevDate = new Date(activityDates[i-1]);
    const currentDate = new Date(activityDates[i]);
    const daysDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  // Check if streak continues to today
  const today = formatDate(new Date(), 'YYYY-MM-DD');
  const lastActivityDate = activityDates[activityDates.length - 1];
  const daysSinceLastActivity = (new Date(today) - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastActivity <= 1) {
    return currentStreak;
  } else {
    return 0; // Streak broken
  }
}
```

## Data Sources and Accuracy

### Primary Data Sources

#### Progress Events
- **Collection method**: Real-time event logging during user interactions
- **Event types**: lesson_start, lesson_finish, journal_start, journal_finish, scout_analytics
- **Timestamp precision**: Millisecond accuracy with timezone information
- **Storage**: Browser localStorage with periodic server sync
- **Reliability**: 99.5% capture rate under normal network conditions

#### On-Task Tracking
- **Monitoring method**: Page visibility API, user interaction detection, idle detection
- **Sampling rate**: Every 30 seconds when active
- **Idle threshold**: 2 minutes without interaction triggers idle state
- **Resume detection**: Any mouse/keyboard/touch input resumes tracking
- **Accuracy**: ±30 seconds for session boundaries

#### Assignment System
- **Data source**: Teacher-created assignments with lesson associations
- **Due date precision**: Date and time with timezone handling
- **Completion detection**: Automatic based on lesson finish events
- **Status updates**: Real-time as students complete work
- **Synchronization**: Updates every 5 minutes across all devices

### Data Quality Considerations

#### Network Dependency
- **Online operation**: Real-time sync requires internet connection
- **Offline capability**: Local storage maintains data during disconnections
- **Sync recovery**: Automatic upload when connection restored
- **Data loss risk**: <0.1% when proper browser storage enabled

#### Browser Compatibility
- **Modern browsers**: Full feature support in Chrome 90+, Firefox 88+, Safari 14+
- **Fallback modes**: Reduced tracking in older browsers
- **Mobile devices**: Full support on iOS 14+ and Android 10+
- **Storage limits**: 5MB+ local storage required for full functionality

#### Time Zone Handling
- **Local time**: All timestamps converted to school's local timezone
- **Daylight saving**: Automatic adjustment for DST transitions
- **Cross-timezone**: Supports students in different timezones
- **Report consistency**: All reports use school timezone regardless of user location

### Accuracy Limitations

#### Estimated Durations
- **Lesson estimates**: 8-minute average when actual duration unavailable
- **Journal estimates**: 5-minute average for writing activities
- **Variation range**: Actual times may vary ±50% from estimates
- **Improvement over time**: Estimates refined based on historical data

#### Session Boundary Detection
- **30-minute rule**: Activities >30 minutes apart count as separate sessions
- **Edge cases**: Brief disconnections may artificially split sessions
- **Manual override**: Teachers can adjust session boundaries if needed
- **Statistical impact**: <5% variance in typical classroom usage

#### Assignment Attribution
- **Completion timing**: Assignment credited when lesson completed, not when assigned
- **Late submissions**: Properly attributed to completion week, not assignment week
- **Partial credit**: Only fully completed lessons count toward metrics
- **Retry handling**: Multiple attempts count as single completion

### Data Privacy and Security

#### Student Privacy
- **COPPA compliance**: No personally identifiable information stored unnecessarily
- **Local storage**: Sensitive data kept on school devices when possible
- **Access controls**: Teachers only see their own class data
- **Export restrictions**: Personal information excluded from bulk exports

#### Data Retention
- **Active data**: Maintained while student is enrolled
- **Historical data**: 2-year retention for educational continuity
- **Graduation cleanup**: Data archived/deleted according to school policy
- **Backup procedures**: Regular backups with encrypted storage

#### Security Measures
- **Transport encryption**: All data transmission uses HTTPS/TLS
- **Storage encryption**: Sensitive data encrypted at rest
- **Access logging**: All data access events logged for audit
- **Vulnerability monitoring**: Regular security assessments and updates