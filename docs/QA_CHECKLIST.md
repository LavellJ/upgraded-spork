# QA Testing Checklist - Classroom & Reporting Features

This checklist ensures all classroom management and reporting features work correctly across different scenarios and devices. Use this for pre-release testing and ongoing quality assurance.

## Table of Contents

1. [CSV Roster Import Testing](#csv-roster-import-testing)
2. [Class Code & Quick-Start Testing](#class-code--quick-start-testing)
3. [Projector-Safe Mode Testing](#projector-safe-mode-testing)
4. [Weekly Report Generation Testing](#weekly-report-generation-testing)
5. [Parent Summary Export Testing](#parent-summary-export-testing)
6. [Cross-Device Compatibility Testing](#cross-device-compatibility-testing)
7. [Edge Cases & Error Handling](#edge-cases--error-handling)

## CSV Roster Import Testing

### Valid CSV Files
- [ ] **Basic format**: Test CSV with name,ageband columns and 3-5 students
- [ ] **With emails**: Test CSV including optional email column
- [ ] **Case insensitive headers**: Test with "Name,AgeBand,Email" (capitals)
- [ ] **Extra whitespace**: Test with spaces around headers and values
- [ ] **Large files**: Test with 30+ students (typical class size)
- [ ] **Unicode names**: Test with accented characters, apostrophes, hyphens

### Invalid CSV Files
- [ ] **Missing headers**: Test file without required "name" or "ageband" columns
- [ ] **Invalid age bands**: Test with "kindergarten", "grade-1", etc.
- [ ] **Empty names**: Test rows with blank name field
- [ ] **Single character names**: Test names with only 1 character
- [ ] **Invalid emails**: Test with "notanemail", "@missing.com", etc.
- [ ] **Mixed validity**: Test file with both valid and invalid rows

### CSV Validation Feedback
- [ ] **Error flagging**: Invalid rows highlighted with specific error messages
- [ ] **Row numbers**: Error messages include correct row numbers (accounting for header)
- [ ] **Multiple errors**: Rows with multiple issues show all error types
- [ ] **Warning messages**: Duplicate names generate warnings but allow import
- [ ] **Summary statistics**: Show count of valid/invalid rows before import
- [ ] **Preview table**: Display parsed data before final import confirmation

### Class Creation from CSV
- [ ] **Class naming**: Allow custom class name during import process
- [ ] **Code generation**: Generate unique 6-character alphanumeric class codes
- [ ] **Student creation**: All valid CSV rows create learner profiles
- [ ] **Age band assignment**: Correct age band applied to each student
- [ ] **Duplicate handling**: Duplicate names allowed but flagged
- [ ] **Partial imports**: Valid students imported even when some rows fail

## Class Code & Quick-Start Testing

### Class Code Generation
- [ ] **Format validation**: Codes are exactly 6 characters, A-Z and 2-9 only
- [ ] **No confusing chars**: Codes exclude O, 0, I, 1 to prevent confusion
- [ ] **Uniqueness**: No duplicate codes generated across multiple classes
- [ ] **Regeneration**: Teachers can generate new codes for existing classes
- [ ] **Code display**: Codes shown prominently in teacher class management

### Student Quick-Start Entry
- [ ] **Homepage visibility**: "Join Class" button prominent on app homepage
- [ ] **Code input field**: Clear input field with placeholder text
- [ ] **Case insensitive**: Codes work regardless of student typing case
- [ ] **Invalid code handling**: Clear error message for non-existent codes
- [ ] **Success feedback**: Clear confirmation when code accepted
- [ ] **Automatic configuration**: Projector presets applied immediately

### Cross-Device Quick-Start
- [ ] **Tablets**: iPad and Android tablets can join via class code
- [ ] **Laptops**: Windows, Mac, and Chromebook compatibility
- [ ] **Interactive whiteboards**: Smart boards and Promethean panels
- [ ] **Shared computers**: Computer lab and library station compatibility
- [ ] **Browser compatibility**: Chrome, Firefox, Safari, Edge support

## Projector-Safe Mode Testing

### Privacy Features - Names Hidden
- [ ] **Student names replaced**: All instances of student names become "Student" or generic identifier
- [ ] **Progress displays**: Individual progress shows without personal identification
- [ ] **Leaderboards**: No student names visible in any ranking displays
- [ ] **Chat/messaging**: Personal identifiers removed from any communication
- [ ] **Avatar hiding**: Personal avatars replaced with generic placeholders
- [ ] **Assignment feedback**: Personal comments/notes hidden in classroom view

### Privacy Features - Show Initials Option
- [ ] **First initial only**: Names become "A. Smith" → "A." format
- [ ] **Consistent application**: All name displays use same initial format
- [ ] **Duplicate initials**: Multiple students with same initial get numbers (A.1, A.2)
- [ ] **Special characters**: Names with apostrophes/hyphens handled correctly
- [ ] **Unicode initials**: International names show correct first character

### Font Scaling
- [ ] **125% scale**: Text noticeably larger but still fits on screen
- [ ] **150% scale**: Comfortable reading from 10-15 feet away
- [ ] **200% scale**: Large enough for back of classroom (20+ feet)
- [ ] **UI element scaling**: Buttons, icons, and interface elements scale proportionally
- [ ] **Content preservation**: No text cutoff or layout breaking at any scale
- [ ] **Interactive elements**: Clickable areas scale appropriately

### Visual Optimizations
- [ ] **High contrast mode**: Enhanced text contrast for projector clarity
- [ ] **Simplified interface**: Non-essential elements hidden/minimized
- [ ] **Focus highlighting**: Active content area clearly highlighted
- [ ] **Color adjustments**: Colors optimized for projector display
- [ ] **Animation reduction**: Distracting animations minimized or disabled
- [ ] **Cursor visibility**: Large, high-contrast cursor for pointer visibility

### Projector Mode Activation
- [ ] **Manual toggle**: Teacher can enable/disable from settings
- [ ] **Class code automatic**: Mode activates when students join via class code
- [ ] **Persistent settings**: Mode remains active until manually disabled
- [ ] **Device detection**: Auto-activation when projector detected (if supported)
- [ ] **Quick reset**: One-click return to normal mode
- [ ] **Status indicator**: Clear indication when projector mode is active

### What Remains Visible in Projector Mode
- [ ] **Lesson content**: Educational material fully accessible
- [ ] **Instructions**: Clear, readable instructions for activities
- [ ] **Timer displays**: Session timers and countdown displays
- [ ] **Group progress**: Class-wide metrics and progress indicators
- [ ] **Navigation**: Essential navigation elements remain functional
- [ ] **Error messages**: Important system messages still shown

## Weekly Report Generation Testing

### Report Data Accuracy
- [ ] **Week boundaries**: Monday 00:00 to Sunday 23:59 in school timezone
- [ ] **Active minutes calculation**: Matches sum of individual student minutes
- [ ] **Session counting**: Correctly identifies distinct learning sessions
- [ ] **Assignment completion**: Accurate count of lessons completed during week
- [ ] **Due date tracking**: Correct identification of due soon/overdue assignments
- [ ] **Student inclusion**: All class members included, even with zero activity

### Individual Student Metrics
- [ ] **Minutes calculation**: On-task time calculated correctly vs. fallback estimates
- [ ] **Session detection**: 30-minute gap rule applied consistently
- [ ] **Assignment attribution**: Completed assignments attributed to correct week
- [ ] **Cross-midnight sessions**: Sessions spanning midnight handled correctly
- [ ] **Timezone consistency**: All calculations use school timezone
- [ ] **Missing data handling**: Graceful handling when student data unavailable

### Report Timing and Generation
- [ ] **Monday generation**: Reports available every Monday by 7:00 AM
- [ ] **Previous week data**: Reports include complete previous week (Mon-Sun)
- [ ] **Automated generation**: No manual intervention required
- [ ] **Generation reliability**: Reports generate even with partial data
- [ ] **Historical access**: Previous week reports remain accessible
- [ ] **Processing time**: Reports complete within 1 hour of generation start

### Export Formats
- [ ] **PDF layout**: Landscape orientation with readable fonts and proper margins
- [ ] **CSV format**: Machine-readable with proper headers and data types
- [ ] **Email delivery**: Automated delivery works (if configured)
- [ ] **File naming**: Consistent, descriptive file names with dates
- [ ] **Data consistency**: Same data across PDF and CSV formats
- [ ] **Character encoding**: UTF-8 encoding preserves international characters

## Parent Summary Export Testing

### Report Content Accuracy
- [ ] **Week accomplishments**: Correct lessons completed with dates and subjects
- [ ] **Subject mapping**: Forest→Literacy, Desert→Math, Ocean→Science, Night→HASS
- [ ] **Journal sessions**: Accurate count of reflection/practice activities
- [ ] **Scout tips usage**: Correct count of AI assistant interactions
- [ ] **Learning streak**: Accurate consecutive day calculation
- [ ] **Assignment status**: Correct upcoming and completed assignment lists

### Print Layout and Styling
- [ ] **Single page fit**: All content fits on one 8.5" x 11" page
- [ ] **Print margins**: 1-inch margins on all sides maintained
- [ ] **Font hierarchy**: Clear distinction between headers and body text
- [ ] **Print-only styles**: @media print CSS rules applied correctly
- [ ] **Hidden elements**: Screen-only buttons hidden in print output
- [ ] **Page breaks**: No awkward content splits across pages (if multi-page)

### Print Quality Testing
- [ ] **Black and white**: Report readable when printed in grayscale
- [ ] **High contrast**: Sufficient contrast between text and background
- [ ] **Font clarity**: Sans-serif fonts print clearly at 11-12pt size
- [ ] **Visual elements**: QR codes, icons, and graphics print clearly
- [ ] **Layout preservation**: Grid layout maintains structure in print
- [ ] **Background graphics**: Instructions work for enabling school logos

### Browser Print Compatibility
- [ ] **Chrome printing**: Print and "Save as PDF" work correctly
- [ ] **Firefox printing**: Consistent layout and functionality
- [ ] **Safari printing**: Proper rendering on macOS devices
- [ ] **Edge printing**: Compatibility with Windows school computers
- [ ] **Mobile printing**: Print options available on tablets (iOS/Android)
- [ ] **Print preview**: Accurate preview before printing

### Content Personalization
- [ ] **Student name display**: Correct student name or "Your Child" fallback
- [ ] **Week date range**: Proper week display (e.g., "Jan 13-19, 2025")
- [ ] **Generation date**: Current date shown accurately
- [ ] **QR code generation**: Valid QR code links to app homepage
- [ ] **Biome translation**: Technical lesson IDs converted to readable names
- [ ] **Positive framing**: Accomplishments highlighted, encouragement provided

### Learning Insights Generation
- [ ] **Streak insights**: Appropriate message for learning streaks > 0
- [ ] **Focus time insights**: Message shown when on-task minutes > 0
- [ ] **Scout usage insights**: Recognition for appropriate help-seeking
- [ ] **Encouragement messaging**: Supportive message when no activity
- [ ] **Subject balance**: Insights about learning across different areas
- [ ] **Parent tips**: Relevant suggestions for home support

## Cross-Device Compatibility Testing

### Device Categories
- [ ] **iPads**: iOS 14+ with Safari browser
- [ ] **Android tablets**: Android 10+ with Chrome browser
- [ ] **Windows laptops**: Windows 10+ with Chrome/Edge browser
- [ ] **MacBooks**: macOS 11+ with Safari/Chrome browser
- [ ] **Chromebooks**: ChromeOS with Chrome browser
- [ ] **Smart boards**: Interactive whiteboard browsers and apps

### Feature Compatibility Matrix
- [ ] **CSV import**: File picker works on all supported devices
- [ ] **Class code entry**: Touch and keyboard input work correctly
- [ ] **Projector mode**: Font scaling and privacy features work consistently
- [ ] **Report generation**: Export functionality available on all devices
- [ ] **Print functionality**: Native print dialog accessible
- [ ] **QR code scanning**: Generated codes scannable by mobile devices

### Network and Storage Requirements
- [ ] **Online functionality**: All features work with stable internet connection
- [ ] **Offline capability**: Local storage maintains data during brief disconnections
- [ ] **Sync recovery**: Data uploads successfully when connection restored
- [ ] **Storage limits**: Features work within browser storage constraints
- [ ] **Low bandwidth**: Acceptable performance on slower school networks
- [ ] **Shared devices**: Multiple users can use same device sequentially

## Edge Cases & Error Handling

### Data Boundary Testing
- [ ] **Empty classes**: Features work with zero students
- [ ] **Large classes**: Performance acceptable with 50+ students
- [ ] **No activity weeks**: Reports generate correctly with zero activity
- [ ] **Maximum activity**: System handles very active students (100+ events/week)
- [ ] **Long streaks**: Streak calculation works for 30+ day streaks
- [ ] **Future dates**: System handles assignments due in distant future

### Network and System Failures
- [ ] **Connection loss**: Graceful handling of network disconnections
- [ ] **Slow connections**: Acceptable performance on poor networks
- [ ] **Server errors**: Clear error messages when backend unavailable
- [ ] **Browser crashes**: Data recovery when browser reopened
- [ ] **Storage full**: Clear error when browser storage limits reached
- [ ] **Corrupted data**: Recovery mechanisms for damaged local storage

### User Input Edge Cases
- [ ] **Special characters**: Names with unicode, apostrophes, accents
- [ ] **Very long names**: Names exceeding typical length limits
- [ ] **Duplicate codes**: Handling when class codes conflict (rare)
- [ ] **Invalid dates**: Robust handling of malformed date inputs
- [ ] **Empty files**: Appropriate error for empty CSV uploads
- [ ] **Binary files**: Clear error when non-text files uploaded

### Browser and System Edge Cases
- [ ] **Old browsers**: Graceful degradation in unsupported browsers
- [ ] **Disabled JavaScript**: Clear message when JS required
- [ ] **Disabled cookies**: Warning when local storage unavailable
- [ ] **Small screens**: Mobile phone compatibility (limited but functional)
- [ ] **Very large screens**: 4K display compatibility
- [ ] **Zoomed browsers**: Accessibility zoom compatibility

### Timezone and Date Edge Cases
- [ ] **Daylight saving**: Correct handling during DST transitions
- [ ] **New Year boundary**: Week calculations across year boundaries
- [ ] **Leap years**: February 29th handling in streak calculations
- [ ] **Different timezones**: Students in different zones than school
- [ ] **Server timezone**: Consistent behavior regardless of server location
- [ ] **Date format variations**: International date format compatibility

## Pre-Release Checklist

### Final Verification Steps
- [ ] **All automated tests pass**: Run complete test suite without failures
- [ ] **Manual test scenarios**: Complete at least 3 full user journeys
- [ ] **Cross-browser testing**: Test in Chrome, Firefox, Safari, and Edge
- [ ] **Mobile device testing**: Test on actual tablets and phones
- [ ] **Print testing**: Physical print tests on actual printers
- [ ] **Performance testing**: Verify acceptable load times and responsiveness

### Documentation Verification
- [ ] **User guides current**: Documentation matches actual feature behavior
- [ ] **API documentation**: Technical docs reflect current implementation
- [ ] **Error messages**: All error messages are user-friendly and actionable
- [ ] **Help text**: In-app help text is accurate and helpful
- [ ] **Release notes**: Changes documented for teachers and administrators

### Security and Privacy Review
- [ ] **Student data protection**: No unauthorized data exposure
- [ ] **Access controls**: Users only see appropriate data for their role
- [ ] **Data retention**: Compliance with school data retention policies
- [ ] **Export restrictions**: Personal data excluded from inappropriate exports
- [ ] **Audit logging**: All data access events properly logged

---

## Test Result Template

Use this template to document test results:

**Test Date**: _________________
**Tester**: _________________
**Browser/Device**: _________________
**Version**: _________________

### Test Results Summary
- Total test cases: ___
- Passed: ___
- Failed: ___
- Skipped: ___

### Critical Issues Found
1. Issue description:
   - Steps to reproduce:
   - Expected behavior:
   - Actual behavior:
   - Severity: Critical/High/Medium/Low

### Non-Critical Issues Found
1. Issue description:
   - Impact:
   - Suggested fix:

### Recommendations
- Release readiness: Ready/Not Ready
- Additional testing needed:
- Follow-up actions required:

**Tester Signature**: _________________