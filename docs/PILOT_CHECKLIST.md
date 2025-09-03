# Pilot Setup Checklist

**LearnOz Classroom Deployment Runbook**

This checklist ensures a smooth setup day for classroom pilots. Follow these steps to configure safe learning environments with appropriate guardrails and presentation modes.

## Pre-Setup (30 minutes before class)

### 1. Device Preparation
- [ ] **Open the LearnOz application** in a web browser
- [ ] **Access Teacher Panel** via the bottom settings button
- [ ] **Navigate to 🚀 Pilot tab** (DEV environment only)
- [ ] **Verify internet connection** is stable and fast

### 2. Feature Flag Configuration

#### For Controlled Classroom Environment:
- [ ] **Scout Guardrails**: ✅ **ENABLED** (recommended)
  - Limits Scout message frequency for less distraction
  - Prevents message overload during lessons
  
- [ ] **Assignment Nudges**: ⚠️ **DISABLE** for exploration sessions
  - Turn off if students should focus on free exploration
  - Keep on if following specific assignment schedules
  
- [ ] **Projector Mode Default**: ✅ **ENABLE** for shared screens
  - Automatically hides student names for privacy
  - Boosts font sizes for better visibility
  - Reduces animations for projection clarity

#### For Testing/QA Sessions:
- [ ] **Scout Guardrails**: ❌ **DISABLED** 
  - Allows full message volume for testing Scout behavior
  - Only use when specifically testing messaging features

## Setup Day Checklist

### Phase 1: Technical Setup (10 minutes)

1. **Open Application**
   - [ ] Navigate to the LearnOz app URL
   - [ ] Verify app loads completely (no loading errors)
   - [ ] Check for any error messages in development tools

2. **Configure Pilot Settings**
   - [ ] Access Teacher Panel → 🚀 Pilot tab
   - [ ] Apply classroom configuration (see above)
   - [ ] **Test projector mode** if using shared display:
     - [ ] Click "Enter Projector" to verify privacy-safe display
     - [ ] Confirm names are hidden, fonts are large
     - [ ] Exit projector mode for individual devices

3. **Verify Activity Player**
   - [ ] Open any lesson with video content
   - [ ] Confirm video loads without errors
   - [ ] Test error recovery:
     - [ ] Refresh page during video playback
     - [ ] Verify friendly error boundary appears if needed

### Phase 2: Student Onboarding (15 minutes)

1. **Test Student Flow**
   - [ ] Create or select a student profile
   - [ ] Navigate through the learning map (Quest Island)
   - [ ] Start one lesson to verify complete flow
   - [ ] Test Scout messaging (if guardrails are enabled)

2. **Accessibility Check**
   - [ ] Test with different zoom levels (100%, 125%, 150%)
   - [ ] Verify audio/video captions work
   - [ ] Check keyboard navigation basics

3. **Backup Plan Setup**
   - [ ] Bookmark the app URL for easy access
   - [ ] Have contact info for technical support ready
   - [ ] Know how to refresh/restart if needed

### Phase 3: Classroom Management (ongoing)

#### During Class:
- **Monitor for Issues**:
  - [ ] Watch for any student error screens
  - [ ] Listen for audio/video playback problems
  - [ ] Observe if Scout messages are appropriate frequency

- **Quick Fixes**:
  - **Video won't load**: Click "Try Again" on error boundary
  - **Too many Scout messages**: Go to Pilot tab → Enable Scout Guardrails
  - **Names visible on projector**: Go to Pilot tab → Enable Projector Mode Default

#### Emergency Restart:
1. **For Individual Student**: Refresh browser tab (Ctrl+R / Cmd+R)
2. **For Whole Class**: Guide students to refresh their browsers
3. **For Persistent Issues**: Contact tech support immediately

## Post-Session Review

### Data Collection
- [ ] **Export analytics** from Teacher Panel → Reports tab
- [ ] **Note any error patterns** that occurred
- [ ] **Document feature flag settings** that worked best
- [ ] **Record student engagement observations**

### Configuration Notes
- **Scout Guardrails**: Worked well? Too restrictive? Just right?
- **Assignment Nudges**: Helpful or distracting for this session type?
- **Projector Mode**: Necessary for privacy? Font size appropriate?

## Quick Reference Card

### Essential Controls
| Need | Action | Location |
|------|--------|----------|
| Hide student names | Enable Projector Mode | Pilot tab → Projector Mode Default |
| Reduce Scout messages | Enable Scout Guardrails | Pilot tab → Scout Guardrails |
| Stop assignment reminders | Disable Assignment Nudges | Pilot tab → Assignment Nudges |
| Fix video error | Click "Try Again" | On error screen |
| Restart everything | Refresh browser | Ctrl+R (Cmd+R on Mac) |

### Support Contacts
- **Technical Issues**: Contact your deployment team
- **Curriculum Questions**: Refer to lesson documentation
- **Student Access Problems**: Check student roster settings

---

## Troubleshooting Common Issues

### Scout Messages
- **Too many messages**: Enable Scout Guardrails in Pilot tab
- **No messages at all**: Check if Scout Guardrails disabled (QA mode)
- **Messages not age-appropriate**: Verify student profile age settings

### Video/Activity Issues
- **Video won't play**: Check internet connection, try "Try Again" button
- **Error boundary shows**: Click "Try Again" or "Refresh Page" 
- **Captions missing**: Verify video has caption tracks available

### Display Issues
- **Names visible on projector**: Enable Projector Mode Default
- **Text too small for projection**: Manually enter Projector Mode
- **Animations distracting**: Projector Mode automatically reduces motion

### Student Access
- **Can't find lesson**: Check if lesson is in correct learning path
- **Progress not saving**: Verify stable internet connection
- **Multiple students same device**: Use roster management to switch profiles

---

*Last updated: Setup for safe pilot switches and classroom deployment*