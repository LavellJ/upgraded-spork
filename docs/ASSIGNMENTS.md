# Assignment System QA Checklist

This document provides a comprehensive quality assurance checklist for the LearnOz Assignment Path v2 system, covering creation, editing, navigation, and user experience testing.

## Overview

The Assignment System allows educators to create structured learning paths for students with due dates, progress tracking, and intelligent prioritization. This checklist ensures all functionality works correctly across different scenarios.

## Pre-Testing Setup

- [ ] Ensure test environment has assignment data or create sample assignments
- [ ] Have multiple learner profiles available for testing
- [ ] Test with different device types (desktop, tablet, mobile)
- [ ] Clear browser cache and localStorage before major test cycles

## Assignment Creation & Management

### Creating New Assignments

- [ ] **Basic Path Creation**
  - [ ] Create assignment with name, lesson selection, and due date
  - [ ] Verify path appears in assignments list
  - [ ] Check that lessons are correctly associated
  - [ ] Confirm creation timestamp is accurate

- [ ] **Due Date Configuration**
  - [ ] Set path-level due date (applies to all lessons)
  - [ ] Set individual lesson due dates (overrides path due date)
  - [ ] Test with dates in past, present, and future
  - [ ] Verify timezone handling for due dates

- [ ] **Priority Levels**
  - [ ] Create assignments with low, normal, and high priority
  - [ ] Verify priority affects Compass recommendations
  - [ ] Test priority sorting in assignment lists

- [ ] **Advanced Options**
  - [ ] Set custom start dates (startAt field)
  - [ ] Configure expiration dates (expiresAt field)
  - [ ] Test archiving functionality

### Editing Existing Assignments

- [ ] **Path Modifications**
  - [ ] Edit assignment name and verify updates
  - [ ] Add/remove lessons from existing paths
  - [ ] Modify due dates at path and lesson level
  - [ ] Change priority levels

- [ ] **Status Updates**
  - [ ] Mark lessons as in_progress, done, or not_started
  - [ ] Verify progress calculations update correctly
  - [ ] Test bulk status updates

- [ ] **Data Integrity**
  - [ ] Ensure edits don't break lesson relationships
  - [ ] Verify updatedAt timestamp changes
  - [ ] Check that progress tracking remains accurate

## CSV Data Export

### Export Functionality

- [ ] **Basic Export**
  - [ ] Export assignment data to CSV format
  - [ ] Verify all required columns are present
  - [ ] Check data accuracy against UI display

- [ ] **CSV Column Verification**
  - [ ] Assignment ID and name
  - [ ] Lesson IDs and status
  - [ ] Due dates (path and lesson level)
  - [ ] Priority and creation timestamps
  - [ ] Progress percentages
  - [ ] Learner association data

- [ ] **Data Format**
  - [ ] Dates formatted consistently (ISO 8601)
  - [ ] Progress shown as percentages
  - [ ] Status values are human-readable
  - [ ] Special characters handled correctly

- [ ] **File Handling**
  - [ ] CSV downloads successfully
  - [ ] Filename includes timestamp
  - [ ] File opens correctly in spreadsheet applications

## Map Integration & Visual Indicators

### Assignment Chips on Map

- [ ] **Visual Appearance**
  - [ ] Assignment badges appear on assigned lessons
  - [ ] Different visual styles for overdue, due soon, and normal
  - [ ] Color coding matches priority level
  - [ ] Chips don't obscure lesson content

- [ ] **Interactive Behavior**
  - [ ] Clicking chip provides assignment details
  - [ ] Tooltips show due dates and path names
  - [ ] Assignment navigation works correctly

- [ ] **Accessibility Labels**
  - [ ] Screen readers announce assignment status
  - [ ] Keyboard navigation reaches assignment chips
  - [ ] Alt text describes assignment urgency
  - [ ] Focus indicators are visible and clear

### Progress Indicators

- [ ] **Progress Bars**
  - [ ] Accurate completion percentages
  - [ ] Visual progress matches actual data
  - [ ] Smooth updates when status changes

- [ ] **Status Icons**
  - [ ] Correct icons for not_started, in_progress, done
  - [ ] Consistent iconography across platform
  - [ ] Icons scale appropriately on different devices

## Compass Recommendation System

### Priority Order Testing

- [ ] **Overdue Assignments (Highest Priority)**
  - [ ] Compass prioritizes overdue lessons first
  - [ ] Multiple overdue items sorted by due date
  - [ ] Overdue status correctly calculated

- [ ] **Due Soon Assignments (≤48 hours)**
  - [ ] Due today assignments recommended
  - [ ] Due tomorrow assignments recommended  
  - [ ] Due in 2 days assignments recommended
  - [ ] Due in 3+ days NOT in due soon category

- [ ] **Next Assigned Lessons**
  - [ ] Partially completed paths show next lesson
  - [ ] Sequential lesson ordering respected
  - [ ] Completed assignments don't show in recommendations

- [ ] **Fallback to Normal Learner Model**
  - [ ] Recommendations still work with no assignments
  - [ ] Learner mastery data influences choices
  - [ ] Age-appropriate content filtering active

### Reason Display (DEV Mode)

- [ ] **Assignment-Driven Reasons**
  - [ ] "📋 Overdue in {pathName}" for overdue items
  - [ ] "📋 Due soon in {pathName}" for urgent items
  - [ ] "📋 Next assigned in {pathName}" for sequential
  - [ ] Reasons update when assignments change

- [ ] **Tooltip Accuracy**
  - [ ] DEV tooltips show correct reasoning
  - [ ] Path names match actual assignment names
  - [ ] Urgency levels accurately reflected

## Scout Intervention System

### Assignment Nudge Testing

- [ ] **Nudge Triggers**
  - [ ] Map entry nudges appear for urgent assignments
  - [ ] Lesson completion nudges suggest next assignments
  - [ ] Nudges respect priority order (overdue > due soon)

- [ ] **Throttling Behavior**
  - [ ] Maximum 1 assignment nudge per 10 minutes
  - [ ] Throttling applies only to assignment nudges
  - [ ] Other Scout messages unaffected by assignment throttling
  - [ ] Session-based throttling resets appropriately

- [ ] **Nudge Content**
  - [ ] "An assignment is overdue—shall we tackle it?" for overdue
  - [ ] "Want to work on your assignment?" for due soon
  - [ ] CTA button navigates to correct lesson
  - [ ] focusPin functionality works correctly

- [ ] **Analytics Tracking**
  - [ ] Assignment nudges logged to timeline
  - [ ] 'shown' and 'clicked' actions recorded
  - [ ] Analytics appear in Guide Insights
  - [ ] Counters accurate in insights dashboard

## Calendar Integration (.ics Export)

### ICS File Generation

- [ ] **File Creation**
  - [ ] .ics download button appears in Assignment Manager
  - [ ] Click generates and downloads calendar file
  - [ ] Filename uses assignment name (sanitized)

- [ ] **Calendar Event Details**
  - [ ] Event title includes assignment name
  - [ ] Start time uses startAt or createdAt as fallback
  - [ ] End time uses dueAt or reasonable default
  - [ ] Description includes progress and lesson count

- [ ] **Calendar App Integration**
  - [ ] .ics files open in default calendar app
  - [ ] Event appears on correct dates
  - [ ] Reminders and notifications work
  - [ ] Time zones handled correctly

- [ ] **Data Accuracy**
  - [ ] Due dates match assignment settings
  - [ ] Priority levels translated correctly
  - [ ] Progress information current and accurate

## Multi-Learner & Roster Management

### Per-Learner Assignment Scoping

- [ ] **Learner Isolation**
  - [ ] Each learner sees only their assignments
  - [ ] Switching learners shows correct data
  - [ ] No cross-contamination of assignment data

- [ ] **Progress Tracking**
  - [ ] Progress tracked per learner independently
  - [ ] Completion status isolated per learner
  - [ ] Assignment recommendations personalized

- [ ] **Bulk Operations**
  - [ ] Assign same path to multiple learners
  - [ ] Individual due dates per learner possible
  - [ ] Mass updates don't affect wrong learners

### Adult Authentication & Audit

- [ ] **Teacher/Parent Access**
  - [ ] Adults can view all learner assignments
  - [ ] Assignment creation requires adult authentication
  - [ ] Editing permissions properly restricted

- [ ] **Audit Logging**
  - [ ] Assignment creation logged with timestamp
  - [ ] Edits tracked with user identification
  - [ ] Deletion events recorded
  - [ ] Log entries include learner association

## Data Synchronization & Conflicts

### Local-First Sync

- [ ] **Offline Capability**
  - [ ] Assignment creation works offline
  - [ ] Progress updates saved locally
  - [ ] Sync happens when connection restored

- [ ] **Conflict Resolution**
  - [ ] Multiple device edits handled gracefully
  - [ ] Deterministic merge policies applied
  - [ ] No data loss during conflicts
  - [ ] User notified of significant conflicts

- [ ] **Migration Handling**
  - [ ] V1 to V2 assignment migration works
  - [ ] Legacy data preserved during upgrade
  - [ ] No broken references after migration

## Performance & Load Testing

### System Responsiveness

- [ ] **Large Dataset Handling**
  - [ ] Performance with 50+ assignments
  - [ ] Smooth operation with 100+ lessons per path
  - [ ] Responsive UI with complex assignment trees

- [ ] **Memory Usage**
  - [ ] No memory leaks during extended use
  - [ ] Efficient storage of assignment data
  - [ ] Reasonable localStorage usage

### Error Handling

- [ ] **Network Failures**
  - [ ] Graceful degradation when offline
  - [ ] Clear error messages for sync failures
  - [ ] Retry mechanisms for failed operations

- [ ] **Data Corruption**
  - [ ] Recovery from malformed localStorage data
  - [ ] Validation prevents invalid assignment states
  - [ ] Fallback behaviors for missing data

## Accessibility Testing

### Screen Reader Support

- [ ] **Assignment Lists**
  - [ ] Assignments properly announced
  - [ ] Due dates and urgency communicated
  - [ ] Progress information accessible

- [ ] **Navigation**
  - [ ] Keyboard navigation through assignments
  - [ ] Focus management in assignment modals
  - [ ] Skip links for long assignment lists

### Visual Accessibility

- [ ] **Color Contrast**
  - [ ] Assignment status indicators meet WCAG standards
  - [ ] Due date highlighting sufficient contrast
  - [ ] Priority colors distinguishable

- [ ] **Text Scaling**
  - [ ] Assignment text readable at 200% zoom
  - [ ] Layout maintains usability when scaled
  - [ ] No overlapping elements at high zoom

## Platform-Specific Testing

### Browser Compatibility

- [ ] **Desktop Browsers**
  - [ ] Chrome: Assignment features work completely
  - [ ] Firefox: Full functionality confirmed
  - [ ] Safari: No webkit-specific issues
  - [ ] Edge: Calendar downloads work

- [ ] **Mobile Browsers**
  - [ ] Touch interactions for assignment chips
  - [ ] Responsive assignment list layouts
  - [ ] Mobile calendar integration

### PWA Features

- [ ] **Offline Functionality**
  - [ ] Assignment data cached appropriately
  - [ ] Offline assignment progress saved
  - [ ] Sync queue handles assignment updates

- [ ] **Notifications**
  - [ ] Due date reminders (if implemented)
  - [ ] Assignment completion notifications
  - [ ] Progressive enhancement for notifications

## Final Verification

### Data Integrity Checks

- [ ] **Cross-Reference Testing**
  - [ ] Assignment data matches across all views
  - [ ] Progress calculations consistent everywhere
  - [ ] Due dates display consistently

- [ ] **Stress Testing**
  - [ ] Rapid assignment creation/deletion
  - [ ] Quick succession of status updates
  - [ ] High-frequency Scout nudge scenarios

### User Experience Validation

- [ ] **Workflow Testing**
  - [ ] Complete teacher workflow (create → assign → monitor)
  - [ ] Complete student workflow (receive → progress → complete)
  - [ ] Multi-device usage scenarios

- [ ] **Edge Case Coverage**
  - [ ] Assignments with no due dates
  - [ ] Paths with all lessons completed
  - [ ] Expired assignments cleanup
  - [ ] Very long assignment names

## Timezone & Local Time Considerations

### Time Handling

- [ ] **Due Date Calculations**
  - [ ] Start-of-day calculations use local timezone
  - [ ] "Due today" accurate for user's location
  - [ ] Daylight saving time transitions handled

- [ ] **Display Formats**
  - [ ] Due dates shown in user's local format
  - [ ] Consistent time display across platform
  - [ ] Relative dates ("tomorrow", "in 3 days") accurate

## Post-Testing Actions

### Documentation Updates

- [ ] Update user guides with tested workflows
- [ ] Document any discovered edge cases
- [ ] Record performance benchmarks
- [ ] Note accessibility improvements needed

### Issue Tracking

- [ ] Create tickets for any bugs discovered
- [ ] Prioritize critical assignment functionality issues
- [ ] Document workarounds for known limitations
- [ ] Plan regression testing for future updates

---

**Testing Notes:**
- Complete this checklist systematically for each major release
- Test with real assignment data when possible
- Document any deviations or issues discovered
- Verify fixes don't break previously working functionality
- Consider automated testing for core assignment workflows

**Sign-off:**
- [ ] QA Engineer: _______________ Date: ___________
- [ ] Product Owner: _______________ Date: ___________
- [ ] Technical Lead: _______________ Date: ___________