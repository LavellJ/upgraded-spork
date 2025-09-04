# QA Pilot Closeout - Final Testing Checklist

This document outlines the critical testing and verification steps for the pilot closeout release, focusing on Top 10 issues, content tuning verification, reporting deltas, class mode flows, and caption preferences.

## Table of Contents

1. [Top 10 Critical Issues Triage](#top-10-critical-issues-triage)
2. [Content Tuning Pipeline Verification](#content-tuning-pipeline-verification)
3. [Reporting Analytics Delta Verification](#reporting-analytics-delta-verification)
4. [Class Mode Flow Testing](#class-mode-flow-testing)
5. [Caption Preferences & Accessibility](#caption-preferences--accessibility)
6. [Release Readiness Checklist](#release-readiness-checklist)

## Top 10 Critical Issues Triage

### Priority 1 - Data Integrity Issues
- [ ] **Student progress persistence**: Verify progress saves correctly across sessions
- [ ] **Assignment state synchronization**: Check assignment completion tracking
- [ ] **Offline/online sync integrity**: Test data consistency during connectivity changes

### Priority 2 - Accessibility & Privacy
- [ ] **Projector mode anonymization**: Verify names hidden correctly in classroom displays
- [ ] **Caption preferences**: Test text size, opacity, and position controls work
- [ ] **Keyboard navigation**: Ensure all interactive elements are keyboard accessible

### Priority 3 - Performance & Stability
- [ ] **Large class roster handling**: Test with 30+ students per class
- [ ] **Report generation performance**: CSV exports complete within acceptable timeframes
- [ ] **Bundle size compliance**: Verify <200KB initial bundle, <50KB report module

### Priority 4 - Cross-Device Compatibility
- [ ] **iPad Safari rendering**: Critical classroom device compatibility
- [ ] **Chrome/Edge parity**: Consistent behavior across primary browsers
- [ ] **Touch interface responsiveness**: Tablet interaction reliability

## Content Tuning Pipeline Verification

### Tuning Note System Functionality
- [ ] **Creation flow**: Teachers can create tuning notes for lessons
- [ ] **Difficulty adjustments**: getAdjustedDifficultyLevel applies correctly
- [ ] **Hint modifications**: Additional hints display appropriately
- [ ] **Wording changes**: Content modifications render properly

### Storage & Persistence Testing
- [ ] **LocalStorage integrity**: 'qi.tuning.v1' maintains data correctly
- [ ] **CRUD operations**: Create, read, update, delete tuning notes work
- [ ] **Analytics integration**: tuning_applied and difficulty_adjusted events log

### Content Studio Integration
- [ ] **Tuning tab functionality**: Interface allows note management
- [ ] **Real-time preview**: Tuned content displays immediately
- [ ] **Validation checks**: Schema compliance for tuned lessons

## Reporting Analytics Delta Verification

### Week-over-Week Calculations
- [ ] **Delta accuracy**: Trend calculations match manual verification
- [ ] **Percentage changes**: Growth/decline percentages display correctly
- [ ] **Arrow indicators**: Up/down trend symbols show appropriately

### CSV Export Data Integrity
- [ ] **Header consistency**: All expected columns present in exports
- [ ] **Data completeness**: No missing values in generated reports
- [ ] **File naming convention**: Consistent filename patterns with dates

### Parent Summary Generation
- [ ] **Accomplishment tracking**: Weekly achievements calculated correctly
- [ ] **Subject mapping**: Forest→Literacy, Desert→Math, etc. translations
- [ ] **Print formatting**: Single-page layout with proper margins

## Class Mode Flow Testing

### Anonymization Features
- [ ] **Name hiding**: useProjectorSafeName returns "Student" in projector mode
- [ ] **PII protection**: Personal identifiers removed from displays
- [ ] **Initial toggling**: Projector mode toggles work correctly

### Start Now Flows
- [ ] **Class code entry**: Quick join via 6-character codes functions
- [ ] **QR code scanning**: Generated QR codes link correctly to class
- [ ] **Device presets**: Classroom settings apply automatically

### Assignment Integration
- [ ] **Assignment detection**: checkAssignmentNudges identifies active assignments
- [ ] **Focus flow**: "Start Now" redirects to assigned lessons
- [ ******: Class banners display appropriate messaging

## Caption Preferences & Accessibility

### Readability Controls
- [ ] **Text size options**: S/M/L sizing affects video captions
- [ ] **Background opacity**: 0-60% range adjusts caption backgrounds
- [ ] **Position controls**: Auto/bottom placement works correctly

### CSS Implementation
- [ ] **::cue selectors**: Video caption styling applies via CSS variables
- [ ] **Persistence**: 'qi.readability.captions' storage maintains settings
- [ ] **Cross-browser**: Caption customization works in Safari, Chrome, Firefox

### Accessibility Compliance
- [ ] **WCAG 2.1 AA**: Contrast ratios meet 4.5:1 minimum for text
- [ ] **Screen reader support**: aria-labels on Download CSV and Print buttons
- [ ] **Keyboard navigation**: Tab order logical throughout interface

### Focus Management
- [ ] **Modal dialogs**: Focus trapped correctly in feedback widgets
- [ ] **BottomSheet restoration**: Focus returns to opener button after close
- [ ] **Skip links**: Available for complex report layouts

## Release Readiness Checklist

### Pre-Deployment Verification
- [ ] **Automated test suite**: All E2E and unit tests pass
- [ ] **Lighthouse scores**: ≥95 accessibility on Trends & Parent Summary routes
- [ ] **Bundle analysis**: No unexpected size regressions
- [ ] **Database migrations**: Schema changes apply cleanly

### Documentation & Communication
- [ ] **Release notes**: Generated using scripts/release-notes.mts
- [ ] **Feature documentation**: User guides updated for new features
- [ ] **Support materials**: Help text reflects current functionality

### Rollback Preparedness
- [ ] **Database backup**: Recent backup verified restorable
- [ ] **Feature flags**: Critical features can be disabled if needed
- [ ] **Monitoring setup**: Error tracking and performance monitoring active

## Test Environment Configuration

### Browser Testing Matrix
| Browser | Version | Device Type | Priority |
|---------|---------|-------------|----------|
| Chrome | 90+ | Desktop/Tablet | Critical |
| Safari | 14+ | iPad/Desktop | Critical |
| Firefox | 88+ | Desktop | Important |
| Edge | 90+ | Desktop | Important |

### Device Testing Requirements
- [ ] **iPad Air (2019+)**: Primary classroom tablet
- [ ] **Android tablet**: Chrome-based devices
- [ ] **Interactive whiteboard**: Classroom display compatibility
- [ ] **Windows laptop**: Teacher device testing

### Network Conditions
- [ ] **School WiFi simulation**: Limited bandwidth testing
- [ ] **Offline capability**: Graceful degradation verification  
- [ ] **Slow 3G**: Acceptable performance on poor connections

## Acceptance Criteria

### Performance Benchmarks
- Bundle load time: <3 seconds on 3G
- Report generation: <10 seconds for 50 students
- CSV export: <5 seconds for typical class size

### User Experience Standards
- Zero critical accessibility violations
- Sub-2 second interaction responses
- Clear error messaging with recovery options

### Data Quality Requirements
- 100% progress tracking accuracy
- Zero data loss during offline/online transitions
- Consistent calculations across all reporting views

---

## Test Execution Log

**Test Date**: _______________  
**Tester**: _______________  
**Environment**: _______________  
**Build Version**: _______________  

### Summary Results
- Total test cases: ___
- Passed: ___
- Failed: ___
- Blocked: ___

### Critical Issues Identified
1. _________________________
2. _________________________
3. _________________________

### Release Recommendation
- [ ] **Ready for pilot closeout**
- [ ] **Additional testing required**
- [ ] **Critical issues must be resolved**

**QA Sign-off**: _______________  
**Date**: _______________