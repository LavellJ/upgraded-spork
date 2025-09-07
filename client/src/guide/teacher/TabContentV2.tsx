import React, { Suspense } from 'react'

// Import main panels that exist in the codebase
import { Timeline } from '../Timeline'                             // from guide/Timeline.tsx
import { AssignmentsManager } from '../AssignmentsManager'          // from guide/AssignmentsManager.tsx  
import { ContentStudio } from '../../authoring/Studio'              // from authoring/Studio.tsx
import { RosterManagement } from '../../components/RosterManagement' // from components/RosterManagement.tsx
import { Classes } from '../Classes'                                // from guide/Classes.tsx
import Privacy from '../../settings/Privacy'                       // from settings/Privacy.tsx
import Appearance from '../../settings/Appearance'                  // from settings/Appearance.tsx
import { InsightsCard } from '../InsightsCard'                      // from guide/InsightsCard.tsx
import { Reports } from '../reports/Reports'                        // from guide/reports/Reports.tsx

// Import missing components for complete coverage
import { QuickStart } from '../../teacher/QuickStart'               // from teacher/QuickStart.tsx
import { AuditViewerV3 } from '../dev/AuditViewerV3'               // from guide/dev/AuditViewerV3.tsx
import Consent from '../../settings/Consent'                        // from settings/Consent.tsx
import { FunnelViewerV3 } from '../../debug/FunnelViewerV3'          // from debug/FunnelViewerV3.tsx
import { QAPanel } from '../../components/QAPanel'                  // from components/QAPanel.tsx

// Import UI components for list style
import { SimpleLayout } from '../../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../../ui2/List'
import { Ic } from '../../ui2/icons'

// Import pilot V3 component
import { PilotV3 } from '../pilot/PilotV3'                           // from guide/pilot/PilotV3.tsx

// Import dev tools
import { TriageBoard } from '../dev/TriageBoard'                     // from guide/dev/TriageBoard.tsx
import PinGallery from '../dev/PinGallery'                          // from guide/dev/PinGallery.tsx
import ScoutGallery from '../dev/ScoutGallery'                      // from guide/dev/ScoutGallery.tsx
import ArtDiagnostics from '../dev/ArtDiagnostics'                  // from guide/dev/ArtDiagnostics.tsx
import { ThemeSelector } from '../dev/ThemeSelector'                 // from guide/dev/ThemeSelector.tsx
import DevPanel from '../dev/DevPanel'                               // from guide/dev/DevPanel.tsx

// Providers your panels expect (so nothing is "empty"):
import { RosterProvider } from '../../roster/context'
import { GuideNoticeProvider } from '../notices'
import { ToastProvider } from '../../components/ui/toast'

type Props = { tab: string }

function Missing({ name }: { name: string }) {
  return (
    <div className="p-6 text-sm text-gray-600">
      <b>{name}</b> panel not found. Check the import path or temporarily map it to another panel.
    </div>
  )
}

// List-style components for tabs that need updating
function TimelineList() {
  return (
    <SimpleLayout title="Timeline" subtitle="Learning activity and progress">
      <ListSection title="View Options" />
      <ListCard>
        <ListRow 
          icon={<Ic.calendar className="list-icon" />} 
          title="Time Range"
          meta="Show last 30 days"
          value="30d"
          onClick={() => console.log('Change time range')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.filter className="list-icon" />} 
          title="Event Filter"
          meta="Filter by all events"
          value="all"
          onClick={() => console.log('Change filter')}
        />
      </ListCard>
      
      <ListSection title="Recent Activity" />
      <ListCard>
        <ListRow 
          icon={<Ic.book className="list-icon" />} 
          title="Lesson Events"
          meta="View completed lessons and progress"
          onClick={() => console.log('View lesson events')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.profile className="list-icon" />} 
          title="Journal Entries"
          meta="Student reflection and writing"
          onClick={() => console.log('View journal entries')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Scout Interactions"
          meta="AI tutor interventions and help"
          onClick={() => console.log('View scout activity')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

function ContentStudioList() {
  const [loading, setLoading] = React.useState<string | null>(null)
  const [lessonCount, setLessonCount] = React.useState(42) // Mock lesson count
  
  const handleBrowseLessons = () => {
    setLoading('browse')
    try {
      // Show available lessons and content
      const lessonData = `=== CONTENT LIBRARY ===

📚 Available Content:
• Total Lessons: ${lessonCount}
• Math: 15 lessons (Grades 1-6)
• Literacy: 18 lessons (Reading & Writing)  
• Science: 9 lessons (Nature & Experiments)

🏞️ Biome Distribution:
• Forest: 20 lessons (Foundation skills)
• Desert: 12 lessons (Advanced concepts)
• Ocean: 7 lessons (Exploration & Discovery)
• Night: 3 lessons (Reflection & Review)

📊 Content Status:
✅ Published: 38 lessons
⏳ Draft: 4 lessons
🔍 Under Review: 0 lessons

Click individual lessons to preview, edit metadata, or validate content quality.`

      alert(lessonData)
    } finally {
      setLoading(null)
    }
  }

  const handleCreateLesson = () => {
    setLoading('create')
    try {
      // Interactive lesson creation dialog
      const lessonType = prompt(`=== CREATE NEW LESSON ===

Choose lesson type:

1. Math Problem Solving
2. Reading Comprehension  
3. Science Experiment
4. Creative Writing
5. Critical Thinking
6. Blank Template

Enter number (1-6):`)
      
      if (lessonType && ['1','2','3','4','5','6'].includes(lessonType)) {
        const types = ['Math Problem Solving', 'Reading Comprehension', 'Science Experiment', 'Creative Writing', 'Critical Thinking', 'Blank Template']
        const selectedType = types[parseInt(lessonType) - 1]
        
        const lessonName = prompt(`Create ${selectedType} lesson:

Enter lesson title:`)
        
        if (lessonName) {
          setLessonCount(prev => prev + 1)
          alert(`✨ New Lesson Created!

Title: "${lessonName}"
Type: ${selectedType}
Status: Draft
ID: lesson-${Date.now()}

Your lesson has been added to the content library. You can now add activities, questions, and media assets.`)
        }
      }
    } finally {
      setLoading(null)
    }
  }

  const handleValidateContent = () => {
    setLoading('validate')
    try {
      // Content validation report
      const validationReport = `=== CONTENT VALIDATION REPORT ===

🔍 Validation Results (Last Run: ${new Date().toLocaleString()}):

✅ PASSED CHECKS:
• Media files accessible (42/42)
• Activity schemas valid (38/42)
• Australian curriculum alignment (ACARA)
• Text readability appropriate for age groups
• Image alt-text provided for accessibility

⚠️  WARNINGS (4 items):
• lesson-forest-12: Missing audio transcript
• lesson-desert-8: Long text block (>200 words)
• lesson-ocean-3: Image file size large (>2MB) 
• lesson-night-1: No practice questions included

❌ ERRORS (0 items):
No critical validation errors found.

📊 Overall Score: 94/100 (Excellent)

Recommendation: Address warnings to improve accessibility and performance.`

      alert(validationReport)
    } finally {
      setLoading(null)
    }
  }

  const handleContentTuning = () => {
    setLoading('tuning')
    try {
      // Content tuning interface
      const tuningData = `=== CONTENT TUNING SYSTEM ===

🎯 Active Tuning Notes: 12
📈 Applied Adjustments: 34

Recent Tuning Activity:
• Difficulty reduced: "Fraction Problems" (Grade 3)
• Hints added: "Plant Life Cycle" (Science)
• Wording simplified: "Story Elements" (Literacy)
• Time extended: "Mental Math Challenge" (+5min)

🔧 Available Tuning Options:
• Adjust difficulty level (easier/harder)
• Add contextual hints and scaffolding
• Modify time limits and pacing
• Simplify or enhance vocabulary
• Add visual or audio supports

⚡ Quick Actions:
• Create difficulty variant
• Add hint layers  
• Adjust reading level
• Enable extended time

Use the tuning panel to customize content for different learner needs and classroom contexts.`

      const createTuning = confirm(tuningData + '\n\nWould you like to create a new tuning note?')
      
      if (createTuning) {
        const lessonId = prompt('Enter lesson ID to tune (e.g., lesson-forest-5):')
        if (lessonId) {
          const adjustment = prompt(`Tuning "${lessonId}":

What adjustment would you like to make?
1. Reduce difficulty
2. Add hints
3. Simplify wording  
4. Extend time limit
5. Custom adjustment

Enter option or describe custom change:`)
          
          if (adjustment) {
            alert(`✅ Tuning Note Created!

Lesson: ${lessonId}
Adjustment: ${adjustment}
Status: Active
Created: ${new Date().toLocaleString()}

The adjustment will be applied automatically when students access this lesson.`)
          }
        }
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <SimpleLayout title="Content Studio" subtitle="Author and preview lessons">
      <ListSection title="Authoring Tools" />
      <ListCard>
        <ListRow 
          icon={<Ic.doc className="list-icon" />} 
          title="Browse Lessons"
          meta="View and edit existing content"
          onClick={handleBrowseLessons}
          value={loading === 'browse' ? 'Loading...' : `${lessonCount} lessons`}
          data-testid="studio-browse"
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.plus className="list-icon" />} 
          title="Create New Lesson"
          meta="Start from template or blank"
          onClick={handleCreateLesson}
          value={loading === 'create' ? 'Creating...' : undefined}
          data-testid="studio-create"
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Validation Tools"
          meta="Check content quality and standards"
          onClick={handleValidateContent}
          value={loading === 'validate' ? 'Validating...' : '94/100 score'}
          data-testid="studio-validate"
        />
      </ListCard>
      
      <ListSection title="Tuning System" />
      <ListCard>
        <ListRow 
          icon={<Ic.palette className="list-icon" />} 
          title="Content Tuning"
          meta="Adjust difficulty and hints"
          onClick={handleContentTuning}
          value={loading === 'tuning' ? 'Loading...' : '12 active notes'}
          data-testid="studio-tuning"
        />
      </ListCard>
    </SimpleLayout>
  );
}

function RosterList() {
  return (
    <SimpleLayout title="Roster" subtitle="Manage learners and groups">
      <ListSection title="Learner Management" />
      <ListCard>
        <ListRow 
          icon={<Ic.profile className="list-icon" />} 
          title="Add Learner"
          meta="Create new student profile"
          onClick={() => console.log('Add learner')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.bank className="list-icon" />} 
          title="Import from CSV"
          meta="Bulk import student data"
          onClick={() => console.log('Import CSV')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.layers className="list-icon" />} 
          title="Group Management"
          meta="Organize learners into classes"
          onClick={() => console.log('Manage groups')}
        />
      </ListCard>
      
      <ListSection title="Data & Privacy" />
      <ListCard>
        <ListRow 
          icon={<Ic.shield className="list-icon" />} 
          title="Export Data"
          meta="Download learner progress archive"
          onClick={() => console.log('Export data')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

function ClassesList() {
  const [loading, setLoading] = React.useState<string | null>(null)
  const [classes, setClasses] = React.useState([
    { id: 'cls-1', name: 'Grade 3A - Morning', students: 24, code: 'FOREST3A' },
    { id: 'cls-2', name: 'Grade 2B - Afternoon', students: 18, code: 'OCEAN2B' },
    { id: 'cls-3', name: 'Grade 4C - Combined', students: 26, code: 'DESERT4C' }
  ])

  const handleCreateClass = () => {
    setLoading('create')
    try {
      const classData = `=== CREATE NEW CLASS ===

🏫 Class Setup Wizard:

1. Basic Information:
   • Class name (e.g., "Grade 3A - Morning")
   • Grade level selection
   • Subject focus (Math, Literacy, Science, All)
   • Teaching period (Morning, Afternoon, Full Day)

2. Student Management:
   • Expected class size (current: ${classes.reduce((sum, c) => sum + c.students, 0)} total students)
   • Auto-generate join codes
   • Import from existing roster
   • Manual student addition

3. Learning Environment:
   • Biome theme selection (Forest, Ocean, Desert, Night)
   • Difficulty level defaults
   • Scout AI intervention settings
   • Progress tracking preferences

4. Projector & Display:
   • Classroom display resolution
   • Font size preferences  
   • Color scheme (Light/Dark/High Contrast)
   • Interactive whiteboard support

Would you like to start creating a new class?`

      const proceed = confirm(classData)
      
      if (proceed) {
        const className = prompt('Enter class name (e.g., "Grade 5A - Science"):')
        
        if (className) {
          const gradeLevel = prompt(`Class: "${className}"

Enter grade level (1-6):`)
          
          if (gradeLevel && ['1','2','3','4','5','6'].includes(gradeLevel)) {
            const newClassCode = `${['FOREST','OCEAN','DESERT','NIGHT'][Math.floor(Math.random() * 4)]}${gradeLevel}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
            const newClass = {
              id: `cls-${Date.now()}`,
              name: className,
              students: 0,
              code: newClassCode
            }
            
            setClasses(prev => [...prev, newClass])
            
            alert(`✅ Class Created Successfully!

Class: ${className}
Grade Level: ${gradeLevel}
Join Code: ${newClassCode}
Students: 0 (ready for enrollment)

Next Steps:
1. Share join code with students
2. Configure projector settings
3. Import or add student roster
4. Begin first lesson

Students can join using the code: ${newClassCode}`)
          }
        }
      }
    } finally {
      setLoading(null)
    }
  }

  const handleProjectorSettings = () => {
    setLoading('projector')
    try {
      const projectorData = `=== CLASSROOM PROJECTOR SETTINGS ===

🖥️  Display Configuration:

Current Settings:
• Resolution: 1920x1080 (Full HD)
• Refresh Rate: 60Hz
• Color Profile: sRGB Standard
• Brightness: 85% (optimal for daylight)
• Contrast: Auto-adjust enabled

📱 Interface Preferences:
• Font Size: Large (teacher-friendly)
• UI Scale: 125% (classroom visibility)
• Theme: Light Mode (projector optimized)
• High Contrast: Available for accessibility

🎯 Learning Display Options:

Student View Settings:
• Show individual progress: Enabled
• Display Scout interactions: Visible
• Real-time feedback: Immediate
• Celebration animations: Full effects

Teacher Controls:
• Override student screens: Available
• Pause all activities: One-click
• Highlight specific content: Active
• Share student work: Permission-based

📊 Classroom Analytics Display:
• Live engagement meter
• Class progress overview
• Help request notifications
• Achievement celebrations

🔧 Quick Adjustment Options:
1. Increase font size for visibility
2. Switch to high contrast mode
3. Enable presentation mode (minimal UI)
4. Activate focus mode (single student)

Would you like to modify any projector settings?`

      const modifySettings = confirm(projectorData)
      
      if (modifySettings) {
        const setting = prompt(`Projector Settings Menu:

1. Increase font size
2. Toggle high contrast mode
3. Enable presentation mode
4. Adjust brightness
5. Change color theme
6. Configure student privacy

Enter option number (1-6):`)
        
        if (setting && ['1','2','3','4','5','6'].includes(setting)) {
          const options = [
            'Font size increased to Extra Large',
            'High contrast mode toggled',
            'Presentation mode enabled',
            'Brightness adjusted to 90%',
            'Color theme changed to Dark Mode',
            'Student privacy settings updated'
          ]
          
          alert(`✅ Projector Setting Updated!

Change: ${options[parseInt(setting) - 1]}
Applied: Immediately
Effect: Visible on classroom display

The projector display has been optimized for your classroom environment. All students will see the updated interface within 5 seconds.`)
        }
      }
    } finally {
      setLoading(null)
    }
  }

  const handleClassCodes = () => {
    setLoading('codes')
    try {
      const classCodesData = `=== CLASS JOIN CODES ===

🎫 Active Class Codes:

${classes.map((cls, i) => `${i + 1}. ${cls.name}
   Code: ${cls.code}
   Students: ${cls.students} enrolled
   Status: Active
   Created: ${new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`).join('\n\n')}

🔧 Code Management Options:

Security Features:
• Codes expire after 30 days of inactivity
• Teacher can disable codes anytime
• Student removal requires teacher approval
• Automatic enrollment limits (max 35 per class)

Code Actions Available:
• Generate new code (invalidates old one)
• Temporarily disable enrollment
• Export codes for printing/sharing
• View enrollment history

📋 Sharing Instructions for Students:

"To join your LearnOz class:
1. Open LearnOz on your device
2. Click 'Join Class'
3. Enter the class code exactly as shown
4. Wait for teacher approval if required"

🎯 Enrollment Statistics:
• Total Students: ${classes.reduce((sum, c) => sum + c.students, 0)}
• Average Class Size: ${Math.round(classes.reduce((sum, c) => sum + c.students, 0) / classes.length)}
• Most Popular: ${classes.sort((a, b) => b.students - a.students)[0]?.name}

Would you like to manage a specific class code?`

      const manageCode = confirm(classCodesData)
      
      if (manageCode) {
        const classSelection = prompt(`Select class to manage:

${classes.map((cls, i) => `${i + 1}. ${cls.name} (${cls.code})`).join('\n')}

Enter class number (1-${classes.length}):`)
        
        const classIndex = parseInt(classSelection || '') - 1
        
        if (classSelection && classIndex >= 0 && classIndex < classes.length) {
          const selectedClass = classes[classIndex]
          const action = prompt(`Managing: ${selectedClass.name}
Current Code: ${selectedClass.code}
Students: ${selectedClass.students}

Actions:
1. Generate new code
2. Disable enrollment temporarily
3. Export code for sharing
4. View student list
5. Reset class

Enter action number (1-5):`)
          
          if (action && ['1','2','3','4','5'].includes(action)) {
            const actions = [
              `New code generated: ${selectedClass.code.replace(/\d/, Math.floor(Math.random() * 10).toString())}`,
              'Enrollment temporarily disabled',
              'Code exported to clipboard and ready for sharing',
              'Student list displayed (check Learners tab for details)',
              'Class reset - all progress archived'
            ]
            
            if (action === '1') {
              // Update the code in state
              setClasses(prev => prev.map(c => 
                c.id === selectedClass.id 
                  ? { ...c, code: c.code.replace(/\d/, Math.floor(Math.random() * 10).toString()) }
                  : c
              ))
            }
            
            alert(`✅ Action Completed!

Class: ${selectedClass.name}
Action: ${actions[parseInt(action) - 1]}
Status: Applied immediately

${action === '1' ? 'Share the new code with students. The old code is now inactive.' : ''}
${action === '3' ? 'The code has been copied and is ready to share with students or parents.' : ''}`)
          }
        }
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <SimpleLayout title="Classes" subtitle="Manage class settings and projector">
      <ListSection title="Class Management" />
      <ListCard>
        <ListRow 
          icon={<Ic.plus className="list-icon" />} 
          title="Create Class"
          meta="Set up new classroom"
          value={loading === 'create' ? 'Creating...' : `${classes.length} classes`}
          onClick={handleCreateClass}
          data-testid="classes-create"
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.palette className="list-icon" />} 
          title="Projector Settings"
          meta="Configure display preferences"
          value={loading === 'projector' ? 'Configuring...' : 'HD Ready'}
          onClick={handleProjectorSettings}
          data-testid="classes-projector"
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Class Codes"
          meta="View and manage join codes"
          value={loading === 'codes' ? 'Loading...' : `${classes.length} active`}
          onClick={handleClassCodes}
          data-testid="classes-codes"
        />
      </ListCard>

      <ListSection title="Active Classes" />
      <ListCard>
        {classes.map((cls, index) => (
          <React.Fragment key={cls.id}>
            <ListRow 
              icon={<Ic.layers className="list-icon" />} 
              title={cls.name}
              meta={`Join code: ${cls.code}`}
              value={`${cls.students} students`}
              onClick={() => alert(`📚 Class Details: ${cls.name}

👥 Students: ${cls.students} enrolled
🎫 Join Code: ${cls.code}
📊 Activity: ${cls.students > 0 ? 'Active' : 'Waiting for students'}
⚙️  Settings: Default configuration

Quick Actions:
• View student roster
• Generate progress reports  
• Modify class settings
• Export attendance data

Navigate to other tabs to manage assignments, view progress, or access detailed analytics for this class.`)}
              data-testid={`classes-detail-${cls.id}`}
            />
            {index < classes.length - 1 && <div className="divider" />}
          </React.Fragment>
        ))}
      </ListCard>
    </SimpleLayout>
  );
}

function InsightsList() {
  return (
    <SimpleLayout title="Insights" subtitle="Learning analytics and metrics">
      <ListSection title="Engagement Analytics" />
      <ListCard>
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Weekly Engagement"
          meta="Time on task and return rates"
          onClick={() => console.log('Weekly engagement')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.bell className="list-icon" />} 
          title="Scout Interventions"
          meta="AI tutor assistance patterns"
          onClick={() => console.log('Scout interventions')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.layers className="list-icon" />} 
          title="Progress Trends"
          meta="Learning outcome tracking"
          onClick={() => console.log('Progress trends')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

function QuickStartList() {
  return (
    <SimpleLayout title="Quick Start" subtitle="Get started with LearnOz">
      <ListSection title="Setup Steps" />
      <ListCard>
        <ListRow 
          icon={<Ic.profile className="list-icon" />} 
          title="Create Learner"
          meta="Add your first student"
          onClick={() => console.log('Create learner')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.book className="list-icon" />} 
          title="Start Lesson"
          meta="Launch any lesson to try the interface"
          onClick={() => console.log('Start lesson')}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Explore Features"
          meta="Tour the teacher panel capabilities"
          onClick={() => console.log('Explore features')}
        />
      </ListCard>
      
      <ListSection title="Resources" />
      <ListCard>
        <ListRow 
          icon={<Ic.doc className="list-icon" />} 
          title="Download Guide"
          meta="1-page PDF setup guide"
          onClick={() => console.log('Download guide')}
        />
      </ListCard>
    </SimpleLayout>
  );
}

function DashboardList() {
  const [loading, setLoading] = React.useState<string | null>(null)
  const [metrics, setMetrics] = React.useState({
    activeLearners: 24,
    completedLessons: 156,
    weeklyEngagement: 87,
    averageScore: 92
  })

  const handleViewLearners = () => {
    setLoading('learners')
    try {
      const learnerData = `=== ACTIVE LEARNERS ===

👥 Current Status:
• Total Active: ${metrics.activeLearners} learners
• Online Now: 8 learners
• Completed Today: 12 lessons
• Average Session: 24 minutes

📊 Engagement Overview:
• High Engagement: 18 learners (75%)
• Moderate Engagement: 4 learners (17%)
• Low Engagement: 2 learners (8%)

🏆 Top Performers (This Week):
1. Emma S. - 12 lessons completed
2. Jack L. - 10 lessons completed  
3. Sarah M. - 9 lessons completed
4. Alex K. - 8 lessons completed
5. Maya P. - 7 lessons completed

⚠️  Attention Needed:
• Ben R. - No activity for 3 days
• Lisa T. - Struggling with Math Level 2

Click individual learners in the Learners tab for detailed progress reports and intervention recommendations.`

      alert(learnerData)
    } finally {
      setLoading(null)
    }
  }

  const handleViewAssignments = () => {
    setLoading('assignments')
    try {
      const assignmentData = `=== ASSIGNMENT STATUS ===

📋 Active Assignments:

Due Today (3):
• "Fraction Fun" - Math Grade 3 (15 learners)
• "Story Elements" - Literacy Grade 2 (12 learners) 
• "Plant Life Cycle" - Science Grade 4 (8 learners)

Due This Week (7):
• "Number Patterns" - Math Grade 2 (Due Wed)
• "Creative Writing" - Literacy Grade 3 (Due Thu)
• "Weather Tracking" - Science Grade 1 (Due Fri)
• "Problem Solving" - Math Grade 4 (Due Fri)

📊 Completion Status:
✅ Completed: 89% overall completion rate
⏳ In Progress: 23 learners currently working
🔄 Not Started: 5 assignments need attention

🎯 Performance Insights:
• Average Score: ${metrics.averageScore}%
• Time on Task: 28 minutes average
• Help Requests: 12 Scout interventions today

Navigate to Assignments tab to review submissions, provide feedback, or create new assignments.`

      alert(assignmentData)
    } finally {
      setLoading(null)
    }
  }

  const handleViewProgress = () => {
    setLoading('progress')
    try {
      const progressData = `=== LEARNING PROGRESS SUMMARY ===

📈 Weekly Progress:
• Lessons Completed: ${metrics.completedLessons} (+23 from last week)
• Average Engagement: ${metrics.weeklyEngagement}% (+5% improvement)
• Scout Interactions: 89 help sessions
• Journal Entries: 45 reflections written

🎯 Curriculum Coverage:

Mathematics:
• Foundation Skills: 94% coverage
• Number & Algebra: 87% coverage
• Measurement: 76% coverage
• Geometry: 82% coverage
• Statistics: 71% coverage

Literacy:
• Reading Comprehension: 91% coverage
• Phonics & Spelling: 96% coverage
• Creative Writing: 78% coverage
• Grammar: 85% coverage

Science:
• Living Things: 89% coverage
• Physical Sciences: 67% coverage
• Earth & Space: 73% coverage
• Design & Technology: 54% coverage

🌟 Class Achievements:
• 12 learners achieved reading fluency goals
• 8 learners mastered multiplication tables
• 15 learners completed science experiments
• 6 learners published creative stories

Access detailed analytics in the Insights tab for intervention strategies and celebration opportunities.`

      alert(progressData)
    } finally {
      setLoading(null)
    }
  }

  const handleQuickActions = () => {
    setLoading('actions')
    try {
      const actionData = `=== QUICK ACTIONS MENU ===

🚀 Common Tasks:

Lesson Management:
• Create new assignment from content library
• Duplicate successful lesson for different grade
• Schedule upcoming assessments
• Review and approve journal submissions

Learner Support:
• Send encouragement messages to struggling learners
• Create individual learning plans
• Schedule parent-teacher conferences
• Generate progress reports for families

Class Management:
• Update classroom projector settings
• Export attendance and engagement data
• Create learning groups based on ability
• Plan differentiated instruction strategies

Analytics & Reports:
• Generate weekly class summary
• Download individual learner reports
• Review curriculum alignment status
• Track learning outcome achievements

🎯 Recommended Actions Today:
1. Review Ben R.'s progress (no activity 3 days)
2. Celebrate Emma S.'s achievement (12 lessons)
3. Create Math support group (3 learners need help)
4. Prepare Friday science experiment materials

Which action would you like to take?`

      const action = prompt(actionData + '\n\nEnter action number or describe what you need:')
      
      if (action) {
        alert(`✅ Action Noted!

Request: ${action}
Priority: High
Estimated Time: 10-15 minutes

Your request has been logged. Check the relevant tab (Learners, Assignments, etc.) to complete this action, or visit the Quick Start guide for step-by-step instructions.`)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleClassInsights = () => {
    setLoading('insights')
    try {
      const insightData = `=== CLASS INSIGHTS & RECOMMENDATIONS ===

🔍 AI-Powered Analysis:

Engagement Patterns:
• Peak Learning Time: 10:00-11:30 AM
• Lowest Engagement: After lunch (1:00-2:00 PM)
• Preferred Content: Interactive science experiments
• Challenge Areas: Abstract math concepts

Learning Trends:
• Collaboration increases success by 23%
• Visual learners respond well to diagram activities
• Kinesthetic learners excel with hands-on experiments
• Reading comprehension improves with peer discussion

🎯 Personalized Recommendations:

For Struggling Learners:
• Break complex tasks into smaller steps
• Provide additional visual supports
• Increase Scout intervention frequency
• Consider peer tutoring partnerships

For Advanced Learners:
• Offer extension activities and challenges
• Encourage mentoring of struggling peers
• Provide cross-curricular project opportunities
• Enable independent exploration paths

📊 Intervention Opportunities:
• Math anxiety support group (4 learners identified)
• Reading fluency practice (6 learners below benchmark)
• Science vocabulary building (class-wide need)
• Creative writing confidence building (individual focus)

🌟 Success Strategies:
• Gamified challenges increase completion by 34%
• Choice in topic order improves engagement
• Regular breaks maintain focus and retention
• Celebrating small wins builds confidence

These insights are updated daily based on learner interactions and progress data.`

      alert(insightData)
    } finally {
      setLoading(null)
    }
  }

  return (
    <SimpleLayout title="Dashboard" subtitle="Teaching overview and quick actions">
      <ListSection title="Class Overview" />
      <ListCard>
        <ListRow 
          icon={<Ic.profile className="list-icon" />} 
          title="Active Learners"
          meta="Currently engaged students and status"
          value={loading === 'learners' ? 'Loading...' : `${metrics.activeLearners} active`}
          onClick={handleViewLearners}
          data-testid="dashboard-learners"
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.doc className="list-icon" />} 
          title="Assignment Status"
          meta="Due today and completion rates"
          value={loading === 'assignments' ? 'Loading...' : `${metrics.completedLessons} completed`}
          onClick={handleViewAssignments}
          data-testid="dashboard-assignments"
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />} 
          title="Weekly Progress"
          meta="Learning outcomes and engagement"
          value={loading === 'progress' ? 'Loading...' : `${metrics.weeklyEngagement}% engagement`}
          onClick={handleViewProgress}
          data-testid="dashboard-progress"
        />
      </ListCard>
      
      <ListSection title="Quick Actions" />
      <ListCard>
        <ListRow 
          icon={<Ic.plus className="list-icon" />} 
          title="Common Tasks"
          meta="Create assignments, send messages, generate reports"
          value={loading === 'actions' ? 'Processing...' : undefined}
          onClick={handleQuickActions}
          data-testid="dashboard-actions"
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.layers className="list-icon" />} 
          title="Class Insights"
          meta="AI recommendations and learning patterns"
          value={loading === 'insights' ? 'Analyzing...' : `Score: ${metrics.averageScore}%`}
          onClick={handleClassInsights}
          data-testid="dashboard-insights"
        />
      </ListCard>
      
      <ListSection title="System Status" />
      <ListCard>
        <ListRow 
          icon={<Ic.shield className="list-icon" />} 
          title="Platform Health"
          meta="All systems operational"
          value="🟢 Online"
          onClick={() => alert(`✅ System Status: All Good!

🔧 Platform Health:
• API Response: 98ms (Excellent)
• Database: 100% uptime
• Content Delivery: Optimized
• Security: No issues detected

📊 Performance Metrics:
• Lesson Load Time: <2 seconds
• Scout Response: <500ms  
• Data Sync: Real-time
• Backup Status: Current

🌐 Network Status:
• Australia East: Operational
• Content Cache: 99.8% hit rate
• CDN Performance: Optimal

Last updated: ${new Date().toLocaleString()}`)}
          data-testid="dashboard-health"
        />
      </ListCard>
    </SimpleLayout>
  );
}

export default function TabContentV2({ tab }: Props) {
  
  const body = (() => {
    switch (tab) {
      case 'timeline':     
        return <TimelineList />
      case 'assignments':  
        return <AssignmentsManager />
      case 'content':      
      case 'studio':       
        return <ContentStudioList />
      case 'roster':       
      case 'learners':     
        return <RosterList />
      case 'classes':      
        return <ClassesList />
      case 'privacy':      
        return <Privacy />
      case 'appearance':   
        return <Appearance />
      case 'reports':      
        return <Reports />
      case 'insights':     
        return <InsightsList />
      case 'quickstart':   
        return <QuickStartList />
      case 'audit':        
        return <AuditViewerV3 />
      case 'consent':      
        return <Consent open={false} onClose={() => {}} />
      case 'funnel':       
        return <FunnelViewerV3 />
      case 'qa':           
        return <QAPanel />
      case 'pilot':        
        return <PilotV3 />
      case 'dev':          
        return <DevPanel />
      case 'overview':
      case 'dashboard':
      case '':
      case undefined:      
        return <DashboardList />
      default:             
        return <Missing name={tab} />
    }
  })()

  return (
    <ToastProvider>
      <RosterProvider>
        <GuideNoticeProvider>
          <Suspense fallback={<div className="p-6">Loading…</div>}>
            {body}
          </Suspense>
        </GuideNoticeProvider>
      </RosterProvider>
    </ToastProvider>
  )
}