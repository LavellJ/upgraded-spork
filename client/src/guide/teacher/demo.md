# Teacher Panel v2 Layout Demo

## How to Test

1. **Enable the Feature Flag**:
   - Open Teacher Panel (⚙️ button)
   - Navigate to "Triage" tab
   - Scroll to "Teacher Panel v2 (sidebar layout)"
   - Toggle the switch ON

2. **Experience the New Layout**:
   - Close and reopen Teacher Panel
   - See professional sidebar navigation on the left
   - Switch between tabs using sidebar navigation
   - Try the density toggle at the bottom (Cozy ↔ Compact)

## Key Features

### Professional Sidebar Navigation
- Left sidebar with tab navigation
- Clean, organized interface
- Icon-based navigation

### Density Controls
- Cozy mode: Standard spacing
- Compact mode: Reduced spacing (CSS --density: 0.9)
- Toggle available at bottom of sidebar

### Accessibility
- Focus rings on interactive elements
- Skip links for keyboard navigation
- ARIA landmarks and proper semantics
- Screen reader compatible

### Responsive Design
- Full-screen overlay on mobile
- Sidebar layout on desktop
- Proper scroll handling

## Architecture

- **Feature Flag**: `teacherPanelV2` controls layout
- **Backward Compatibility**: Falls back to original layout when disabled
- **Conditional Rendering**: Existing TeacherPanel.tsx switches layouts
- **Shared Components**: New ui2/ components for consistent styling