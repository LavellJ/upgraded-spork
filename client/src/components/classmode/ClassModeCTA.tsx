import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, X, Info } from 'lucide-react';
import { findByCode } from '../../roster/classes';
import { useProjectorSafeName } from '../../hooks/useProjectorMode';
import { checkAssignmentNudges } from '../../utils/assignmentNudges';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ClassModeInfo {
  classCode: string;
  className: string;
  hasAssignments: boolean;
}

interface ClassModeCTAProps {
  onStartActivity: (classCode: string) => void;
  onFocusLesson?: (lessonId: string) => void;
  onDismiss: () => void;
}

export function ClassModeCTA({ onStartActivity, onFocusLesson, onDismiss }: ClassModeCTAProps) {
  const [classModeInfo, setClassModeInfo] = useState<ClassModeInfo | null>(null);
  const [showConsentInfo, setShowConsentInfo] = useState(false);
  
  // Use projector-safe name (will show generic name if projector mode is on)
  const displayClassName = useProjectorSafeName(
    classModeInfo?.className || '', 
    'Class Learning'
  );

  useEffect(() => {
    const checkLastClassCode = () => {
      const lastClassCode = localStorage.getItem('qi.lastClassCode');
      const lastClassName = localStorage.getItem('qi.lastClassName');
      
      if (lastClassCode) {
        // Verify the class still exists
        const userId = 'local-1'; // TODO: Get from user context
        const classInfo = findByCode(userId, lastClassCode);
        
        if (classInfo) {
          // Check if there are active assignments for this class
          const hasAssignments = checkForActiveAssignments(userId);
          
          setClassModeInfo({
            classCode: lastClassCode,
            className: classInfo.name,
            hasAssignments
          });
        } else {
          // Class no longer exists, clear the stored data
          localStorage.removeItem('qi.lastClassCode');
          localStorage.removeItem('qi.lastClassName');
        }
      }
    };

    checkLastClassCode();
  }, []);

  const checkForActiveAssignments = (userId: string): boolean => {
    // Simple check for assignments - this could be expanded to check actual assignment status
    try {
      const assignments = JSON.parse(localStorage.getItem(`qi.${userId}.assigned.paths.v1`) || '[]');
      return assignments.length > 0;
    } catch {
      return false;
    }
  };

  const handleStartActivity = () => {
    if (classModeInfo) {
      onStartActivity(classModeInfo.classCode);
      
      // Try to focus on the next assigned lesson if available
      if (onFocusLesson && classModeInfo.hasAssignments) {
        // This will be handled by the parent component through assignment nudges
        setTimeout(() => {
          const userId = 'local-1'; // TODO: Get from user context
          
          // Trigger assignment nudge system to focus on next lesson
          checkAssignmentNudges(
            userId,
            () => ({ queued: false }), // Return ScoutEnqueueResult
            (lessonId: string) => {
              if (onFocusLesson) {
                onFocusLesson(lessonId);
              }
            }
          );
        }, 500);
      }
    }
  };

  const handleDismissClass = () => {
    // Clear the stored class code
    localStorage.removeItem('qi.lastClassCode');
    localStorage.removeItem('qi.lastClassName');
    setClassModeInfo(null);
    onDismiss();
  };

  // Don't render if no class mode info
  if (!classModeInfo) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200 shadow-lg" data-testid="class-mode-cta">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-blue-900">
              Class Mode
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConsentInfo(!showConsentInfo)}
              className="text-blue-600 hover:text-blue-800"
              data-testid="button-consent-info"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissClass}
              className="text-blue-600 hover:text-blue-800"
              data-testid="button-dismiss-class"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Continue learning with {displayClassName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showConsentInfo && (
          <div className="bg-blue-100 rounded-lg p-3 text-sm text-blue-800" data-testid="consent-info">
            <p className="font-medium mb-1">Privacy Notice</p>
            <p>
              Class mode provides a shared learning experience. Your teacher may monitor progress 
              and provide guidance. Individual data is handled according to our privacy policy.
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleStartActivity}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            data-testid="button-start-activity"
          >
            <span>
              {classModeInfo.hasAssignments 
                ? 'Start next activity' 
                : 'Continue learning'
              }
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          {classModeInfo.hasAssignments && (
            <p className="text-xs text-blue-700 text-center">
              You have assignments ready to complete
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to check if class mode should be shown
 */
export function useClassModeDetection() {
  const [hasLastClassCode, setHasLastClassCode] = useState(false);
  
  useEffect(() => {
    const lastClassCode = localStorage.getItem('qi.lastClassCode');
    setHasLastClassCode(!!lastClassCode);
  }, []);
  
  return { hasLastClassCode };
}