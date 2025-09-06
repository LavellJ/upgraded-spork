import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  Play, 
  BookOpen, 
  CheckCircle, 
  ArrowRight,
  User,
  Lightbulb,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { QuickStartPrint } from '../components/print/QuickStartPrint';
import TeacherLayout from '../guide/teacher/Layout';
import { useFlags } from '../config/flags';

interface QuickStartProps {
  onCreateLearner?: () => void;
  onStartLesson?: () => void;
  onOpenJournal?: () => void;
}

export function QuickStart({ onCreateLearner, onStartLesson, onOpenJournal }: QuickStartProps) {
  const { teacherPanelV2 } = useFlags();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Create a Learner",
      description: "Set up your first student profile to begin tracking progress",
      icon: <Users className="w-6 h-6" />,
      action: "Create Learner",
      onAction: () => {
        onCreateLearner?.();
        setCompletedSteps(prev => new Set([...prev, 1]));
      },
      tips: "Start with just a first name. Age band helps tailor content difficulty."
    },
    {
      id: 2,
      title: "Start First Lesson",
      description: "Launch any lesson to see the learning interface in action",
      icon: <Play className="w-6 h-6" />,
      action: "Browse Lessons",
      onAction: () => {
        onStartLesson?.();
        setCompletedSteps(prev => new Set([...prev, 2]));
      },
      tips: "Try a Forest (Literacy) or Desert (Math) lesson first. Each takes 5-10 minutes."
    },
    {
      id: 3,
      title: "Use Journal if Stuck",
      description: "Show students how to practice skills when they need extra help",
      icon: <BookOpen className="w-6 h-6" />,
      action: "Open Journal",
      onAction: () => {
        onOpenJournal?.();
        setCompletedSteps(prev => new Set([...prev, 3]));
      },
      tips: "Journal generates 3 quick practice questions on any topic. Perfect for review."
    }
  ];

  const isStepCompleted = (stepId: number) => completedSteps.has(stepId);
  const completedCount = completedSteps.size;

  if (showPrintPreview) {
    return <QuickStartPrint onClose={() => setShowPrintPreview(false)} />;
  }

  const body = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-fg-base flex items-center justify-center gap-2">
            <span className="text-2xl">🚀</span>
            Teacher Quick Start
          </h1>
          <Button
            onClick={() => window.open('/teacher-quick-start-guide.html', '_blank')}
            variant="outline"
            size="sm"
            className="gap-2"
            data-testid="download-quickstart-pdf"
          >
            <Download className="w-4 h-4" />
            Download 1-pager (PDF)
          </Button>
        </div>
        <p className="text-fg-muted max-w-2xl mx-auto">
          Get started with LearnOz in 3 simple steps. Perfect for first-time presentations or new classroom setups.
        </p>
        
        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm text-fg-base mb-2">
            <span>Progress</span>
            <span>{completedCount} of {steps.length} complete</span>
          </div>
          <div className="w-full bg-bg-card rounded-full h-2">
            <motion.div 
              className="bg-brand-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Start Steps */}
      <div className="grid gap-4">
        {steps.map((step, index) => {
          const isCompleted = isStepCompleted(step.id);
          const isNext = !isCompleted && (index === 0 || isStepCompleted(index));
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`
                transition-all duration-200 border-2
                ${isCompleted 
                  ? 'border-brand-200 bg-brand-50' 
                  : isNext 
                    ? 'border-brand-200 bg-brand-50 shadow-md' 
                    : 'border-border bg-bg-card'
                }
              `}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Step Number & Icon */}
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                      ${isCompleted 
                        ? 'bg-brand-500 text-white' 
                        : isNext 
                          ? 'bg-brand-500 text-white' 
                          : 'bg-bg-card text-fg-muted'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        step.icon
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-fg-base">
                          Step {step.id}: {step.title}
                        </h3>
                        {isCompleted && (
                          <Badge variant="default" className="bg-brand-50 text-brand-600">
                            Complete
                          </Badge>
                        )}
                        {isNext && !isCompleted && (
                          <Badge variant="default" className="bg-brand-50 text-brand-600">
                            Next
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-fg-muted mb-3">
                        {step.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                          <Lightbulb className="w-4 h-4" />
                          <span>{step.tips}</span>
                        </div>

                        <Button 
                          onClick={step.onAction}
                          disabled={isCompleted}
                          className={`
                            ${isCompleted 
                              ? 'bg-bg-card cursor-not-allowed' 
                              : isNext 
                                ? 'bg-brand-500 hover:bg-brand-600' 
                                : 'bg-bg-card'
                            }
                          `}
                          data-testid={`quickstart-step-${step.id}`}
                        >
                          {isCompleted ? 'Completed' : step.action}
                          {!isCompleted && <ArrowRight className="w-4 h-4 ml-1" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedCount === steps.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 bg-bg-card rounded-lg border border-border shadow-sm"
        >
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-semibold text-fg-base mb-2">
            Quick Start Complete!
          </h3>
          <p className="text-fg-muted">
            You're ready to use LearnOz with your students. 
            Check the Teacher Panel (press 'T') for advanced features and analytics.
          </p>
        </motion.div>
      )}

      {/* Helpful Notes */}
      <Card className="bg-bg-card border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-fg-base">
            <span className="text-lg">💡</span>
            Presentation Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-fg-muted">
              <strong>Projector-Safe Mode:</strong> Press '?' for help menu, then enable projector-safe mode to hide names and boost font sizes
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-fg-muted">
              <strong>Keyboard Shortcuts:</strong> 'T' for Teacher Panel, 'C' for Compass, 'B' for Backpack, 'R' to resume last lesson
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-fg-muted">
              <strong>Demo Mode:</strong> Create a practice learner to demonstrate features without affecting real student data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return teacherPanelV2
    ? <TeacherLayout title="Quick Start" subtitle="Get started in 3 steps">{body}</TeacherLayout>
    : body;
}