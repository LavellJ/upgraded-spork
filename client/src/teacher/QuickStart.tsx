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

interface QuickStartProps {
  onCreateLearner?: () => void;
  onStartLesson?: () => void;
  onOpenJournal?: () => void;
}

export function QuickStart({ onCreateLearner, onStartLesson, onOpenJournal }: QuickStartProps) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
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
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get started with LearnOz in 3 simple steps. Perfect for first-time presentations or new classroom setups.
        </p>
        
        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{completedCount} of {steps.length} complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
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
                  ? 'border-green-200 bg-green-50' 
                  : isNext 
                    ? 'border-blue-200 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-gray-50'
                }
              `}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Step Number & Icon */}
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                      ${isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isNext 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
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
                        <h3 className="text-lg font-semibold text-gray-900">
                          Step {step.id}: {step.title}
                        </h3>
                        {isCompleted && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Complete
                          </Badge>
                        )}
                        {isNext && !isCompleted && (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            Next
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">
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
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : isNext 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-gray-400'
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
          className="text-center p-6 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Quick Start Complete!
          </h3>
          <p className="text-green-700">
            You're ready to use LearnOz with your students. 
            Check the Teacher Panel (press 'T') for advanced features and analytics.
          </p>
        </motion.div>
      )}

      {/* Helpful Notes */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <span className="text-lg">💡</span>
            Presentation Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-blue-800">
              <strong>Projector-Safe Mode:</strong> Press '?' for help menu, then enable projector-safe mode to hide names and boost font sizes
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-blue-800">
              <strong>Keyboard Shortcuts:</strong> 'T' for Teacher Panel, 'C' for Compass, 'B' for Backpack, 'R' to resume last lesson
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-blue-800">
              <strong>Demo Mode:</strong> Create a practice learner to demonstrate features without affecting real student data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}