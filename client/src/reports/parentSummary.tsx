import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { loadEvents, type ProgressEvent } from '../progress/events';
import { calcStreak } from '../utils/streak';
import { getWeekDisplayName } from '../progress/classMetrics';
import { getActiveAssignments } from '../guide/assign';
import { loadRoster } from '../roster/model';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Printer, Download } from 'lucide-react';

interface ParentSummaryProps {
  learnerId: string;
  weekStartISO: string;
}

interface WeeklyAccomplishments {
  lessonsCompleted: number;
  lessonsDetails: Array<{ lessonId: string; biomeId: string; date: string }>;
  journalSessions: number;
  onTaskMinutes: number;
  currentStreak: number;
  scoutTipsUsed: number;
  assignments: {
    completed: Array<{ lessonId: string; completedAt: string }>;
    upcoming: Array<{ lessonId: string; dueAt?: string }>;
  };
}

/**
 * Generates QR code data URL for the app homepage
 */
function generateQRCode(url: string): string {
  // Simple QR code generation using a service
  // In production, you might want to use a more robust QR code library
  const encodedUrl = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodedUrl}`;
}

/**
 * Calculate weekly accomplishments for a learner
 */
function calculateWeeklyAccomplishments(learnerId: string, weekStartISO: string): WeeklyAccomplishments {
  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const allEvents = loadEvents(learnerId);
  const weekEvents = allEvents.filter(event => {
    const eventDate = new Date(event.at);
    return eventDate >= weekStart && eventDate < weekEnd;
  });

  // Calculate lessons completed
  const lessonFinishEvents = weekEvents.filter(e => e.kind === 'lesson_finish' && e.result === 'pass') as Extract<ProgressEvent, { kind: 'lesson_finish' }>[];
  const lessonsDetails = lessonFinishEvents.map(event => ({
    lessonId: event.lessonId,
    biomeId: event.biomeId,
    date: format(new Date(event.at), 'MMM d')
  }));

  // Calculate journal sessions
  const journalFinishEvents = weekEvents.filter(e => e.kind === 'journal_finish') as Extract<ProgressEvent, { kind: 'journal_finish' }>[];

  // Calculate on-task minutes (estimate from lesson durations)
  let onTaskMinutes = 0;
  lessonFinishEvents.forEach(event => {
    if (event.durationSec) {
      onTaskMinutes += event.durationSec / 60;
    } else {
      // Fallback estimate: 8 minutes per lesson
      onTaskMinutes += 8;
    }
  });
  
  journalFinishEvents.forEach(event => {
    if (event.durationSec) {
      onTaskMinutes += event.durationSec / 60;
    } else {
      // Fallback estimate: 5 minutes per journal session
      onTaskMinutes += 5;
    }
  });

  // Calculate current streak
  const activityDates = allEvents
    .filter(e => e.kind === 'lesson_finish' || e.kind === 'journal_finish')
    .map(e => format(new Date(e.at), 'yyyy-MM-dd'));
  const currentStreak = calcStreak(activityDates);

  // Count Scout tips used
  const scoutEvents = weekEvents.filter(e => e.kind === 'scout_analytics' && e.action === 'clicked') as Extract<ProgressEvent, { kind: 'scout_analytics' }>[];
  const scoutTipsUsed = scoutEvents.length;

  // Get assignments
  const assignments = getActiveAssignments(learnerId, { includeArchived: false });
  const completed = lessonsDetails.map(lesson => ({
    lessonId: lesson.lessonId,
    completedAt: lesson.date
  }));
  
  const upcoming = assignments.flatMap(assignment => 
    assignment.lessons
      .filter(lesson => lesson.status !== 'done')
      .map(lesson => ({
        lessonId: lesson.lessonId,
        dueAt: lesson.dueAt ? new Date(lesson.dueAt).toISOString() : (assignment.dueAt ? new Date(assignment.dueAt).toISOString() : undefined)
      }))
  );

  return {
    lessonsCompleted: lessonFinishEvents.length,
    lessonsDetails,
    journalSessions: journalFinishEvents.length,
    onTaskMinutes: Math.round(onTaskMinutes),
    currentStreak,
    scoutTipsUsed,
    assignments: {
      completed,
      upcoming
    }
  };
}

/**
 * Get biome display name
 */
function getBiomeDisplayName(biomeId: string): string {
  const biomeNames: Record<string, string> = {
    forest: 'Literacy',
    desert: 'Math',
    ocean: 'Science',
    night: 'HASS'
  };
  return biomeNames[biomeId] || biomeId;
}

/**
 * Format lesson ID for display
 */
function formatLessonId(lessonId: string): string {
  // Remove prefixes and format nicely
  return lessonId.replace(/^(forest|desert|ocean|night)\./, '').replace(/\./g, ' ');
}

export function ParentSummary({ learnerId, weekStartISO }: ParentSummaryProps) {
  const accomplishments = useMemo(() => {
    return calculateWeeklyAccomplishments(learnerId, weekStartISO);
  }, [learnerId, weekStartISO]);

  // Get learner name
  const roster = loadRoster();
  const learner = roster?.learners.find(l => l.id === learnerId);
  const learnerName = learner?.name || 'Your Child';

  const weekDisplayName = getWeekDisplayName(weekStartISO);
  const today = format(new Date(), 'MMM d, yyyy');
  const appUrl = window.location.origin;
  const qrCodeUrl = generateQRCode(appUrl);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Same as print - browser will offer PDF option
    window.print();
  };

  return (
    <div className="parent-summary-container min-h-screen bg-white text-black">
      {/* Print styles header */}
      <style>{`
        @media print {
          .parent-summary-container {
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            font-size: 12pt;
            line-height: 1.4;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-header {
            border-bottom: 2px solid #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
          }
          
          .print-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .print-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .qr-code {
            width: 60px;
            height: 60px;
          }
          
          h1 { font-size: 18pt; margin: 0 0 10px 0; }
          h2 { font-size: 14pt; margin: 10px 0 5px 0; }
          h3 { font-size: 12pt; margin: 8px 0 4px 0; }
          p, li { font-size: 11pt; margin: 2px 0; }
          
          .accomplishment-item {
            margin: 3px 0;
            padding: 2px 0;
          }
          
          .streak-badge {
            display: inline-block;
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
          }
          
          @page {
            size: A4;
            margin: 1in;
          }
        }
        
        @media screen {
          .parent-summary-container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 20px;
            background: white;
            min-height: 11in;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Screen-only action buttons */}
      <div className="no-print flex gap-2 mb-6">
        <Button 
          onClick={handlePrint} 
          className="flex items-center gap-2"
          aria-label="Print parent summary report"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button 
          onClick={handleDownloadPDF} 
          variant="outline" 
          className="flex items-center gap-2"
          aria-label="Save parent summary report as PDF"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Print instructions */}
      <div className="no-print bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Printing Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Choose "Print" or "Save as PDF" from the print dialog</li>
          <li>• Select "More settings" and enable "Background graphics" for best results</li>
          <li>• For grayscale printing, the report is designed to be readable without color</li>
        </ul>
      </div>

      {/* Report Header */}
      <div className="print-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>LearnOz Weekly Report</h1>
            <p className="text-lg font-semibold">{learnerName}</p>
            <p className="text-gray-600">Week of {weekDisplayName}</p>
            <p className="text-sm text-gray-500">Generated on {today}</p>
          </div>
          <div className="flex flex-col items-center">
            <img src={qrCodeUrl} alt="QR Code to LearnOz" className="qr-code" />
            <p className="text-xs text-center mt-1">Scan to access<br />LearnOz</p>
          </div>
        </div>
      </div>

      <div className="print-grid">
        {/* Left Column */}
        <div>
          {/* Weekly Accomplishments */}
          <div className="print-section">
            <h2>This Week's Accomplishments</h2>
            
            <div className="mb-4">
              <h3>Lessons Completed ({accomplishments.lessonsCompleted})</h3>
              {accomplishments.lessonsDetails.length > 0 ? (
                <ul className="list-none space-y-1">
                  {accomplishments.lessonsDetails.map((lesson, index) => (
                    <li key={index} className="accomplishment-item">
                      <strong>{getBiomeDisplayName(lesson.biomeId)}:</strong> {formatLessonId(lesson.lessonId)}
                      <span className="text-gray-600 ml-2">({lesson.date})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No lessons completed this week</p>
              )}
            </div>

            <div className="mb-4">
              <h3>Practice Sessions</h3>
              <p>Journal sessions completed: <strong>{accomplishments.journalSessions}</strong></p>
              <p>Scout tips used: <strong>{accomplishments.scoutTipsUsed}</strong></p>
            </div>

            <div className="mb-4">
              <h3>Active Learning Time</h3>
              <p>On-task minutes this week: <strong>{accomplishments.onTaskMinutes} minutes</strong></p>
              <p>Current learning streak: <span className="streak-badge">{accomplishments.currentStreak} days</span></p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Assignments and Next Steps */}
          <div className="print-section">
            <h2>Assignments & Next Steps</h2>
            
            <div className="mb-4">
              <h3>Recently Completed</h3>
              {accomplishments.assignments.completed.length > 0 ? (
                <ul className="list-none space-y-1">
                  {accomplishments.assignments.completed.map((assignment, index) => (
                    <li key={index} className="accomplishment-item">
                      ✓ {formatLessonId(assignment.lessonId)}
                      <span className="text-gray-600 ml-2">({assignment.completedAt})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No assignments completed this week</p>
              )}
            </div>

            <div className="mb-4">
              <h3>Coming Up</h3>
              {accomplishments.assignments.upcoming.length > 0 ? (
                <ul className="list-none space-y-1">
                  {accomplishments.assignments.upcoming.slice(0, 5).map((assignment, index) => (
                    <li key={index} className="accomplishment-item">
                      • {formatLessonId(assignment.lessonId)}
                      {assignment.dueAt && (
                        <span className="text-gray-600 ml-2">
                          (Due: {format(new Date(assignment.dueAt), 'MMM d')})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No upcoming assignments</p>
              )}
            </div>
          </div>

          {/* Learning Insights */}
          <div className="print-section">
            <h2>Learning Insights</h2>
            
            {accomplishments.currentStreak > 0 && (
              <div className="mb-3">
                <p><strong>Great consistency!</strong> {learnerName} has been learning for {accomplishments.currentStreak} consecutive days.</p>
              </div>
            )}
            
            {accomplishments.onTaskMinutes > 0 && (
              <div className="mb-3">
                <p><strong>Focus time:</strong> Spent {accomplishments.onTaskMinutes} minutes actively learning this week.</p>
              </div>
            )}
            
            {accomplishments.scoutTipsUsed > 0 && (
              <div className="mb-3">
                <p><strong>Getting help:</strong> Used {accomplishments.scoutTipsUsed} Scout tips to overcome challenges.</p>
              </div>
            )}

            {accomplishments.lessonsCompleted === 0 && accomplishments.journalSessions === 0 && (
              <div className="mb-3">
                <p><strong>Encouragement needed:</strong> No learning activity this week. Consider setting up a regular learning time together.</p>
              </div>
            )}
          </div>

          {/* Parent Tips */}
          <div className="print-section">
            <h2>Tips for Parents</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Celebrate completed lessons and maintain the learning streak</li>
              <li>Ask about favorite subjects and what they learned</li>
              <li>Set aside 15-20 minutes daily for LearnOz activities</li>
              <li>Use the Scout feature to get personalized help</li>
              <li>Check assignments regularly to stay on track</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="print-section border-t pt-4 mt-6 text-center text-xs text-gray-600">
        <p>LearnOz - Australian Curriculum Learning Platform</p>
        <p>Visit {appUrl} or scan the QR code above to access the platform</p>
      </div>
    </div>
  );
}