import React, { useState, useMemo } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { CheckCircle, XCircle, RotateCcw, X } from 'lucide-react';
import type { JournalHistoryEntry } from '../schema/journal';
import { getJournalSession } from './JournalSheet';

interface JournalReviewSheetProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
  onStartRedo?: (skillId: string) => void;
}

export function JournalReviewSheet({ 
  open, 
  onClose, 
  sessionId,
  onStartRedo 
}: JournalReviewSheetProps) {
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const session = useMemo(() => {
    if (!sessionId) return null;
    return getJournalSession(sessionId);
  }, [sessionId]);

  const handleRedo = () => {
    if (session && onStartRedo) {
      onStartRedo(session.skillId);
      onClose();
    }
  };

  if (!open || !session) return null;

  const correctCount = session.responses.filter(r => r.isCorrect).length;
  const accuracy = session.responses.length > 0 ? (correctCount / session.responses.length * 100) : 0;

  return (
    <BottomSheet 
      open={open} 
      onClose={onClose} 
      titleId="review-title"
    >
      <div className="text-gray-800 p-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="review-title" className="text-xl font-bold text-blue-800">
              Journal Review
            </h2>
            <p className="text-sm text-gray-600">
              {session.skillId.replace('.', ' → ')} • {new Date(session.date).toLocaleDateString()}
            </p>
          </div>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            data-testid="close-review-button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Session Summary */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Session Summary</h3>
              <Badge variant={accuracy >= 75 ? "default" : "secondary"}>
                {correctCount}/{session.responses.length} correct ({Math.round(accuracy)}%)
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Target Level:</span>
                <p className="font-medium capitalize">{session.targetLevel}</p>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>
                <p className="font-medium">{Math.round(session.duration / 1000 / 60)}m {Math.round((session.duration / 1000) % 60)}s</p>
              </div>
              <div>
                <span className="text-gray-500">Questions:</span>
                <p className="font-medium">{session.items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Review */}
        <div className="space-y-3 mb-6">
          <h3 className="font-medium">Questions & Answers</h3>
          
          {session.items.map((item, index) => {
            const response = session.responses.find(r => r.itemId === item.id);
            const isSelected = selectedItemIndex === index;
            
            return (
              <motion.div
                key={item.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedItemIndex(isSelected ? null : index)}
                data-testid={`review-item-${index}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {response?.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">
                      Question {index + 1}
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      {item.prompt}
                    </p>
                    
                    {/* Show options for MCQ */}
                    {item.kind === 'mcq' && item.options && (
                      <div className="space-y-1 mb-2">
                        {item.options.map((option, optIndex) => (
                          <div 
                            key={optIndex}
                            className={`text-xs px-2 py-1 rounded ${
                              option === item.answer 
                                ? 'bg-green-100 text-green-800' 
                                : option === response?.userAnswer
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {option} {option === item.answer && '✓'} {option === response?.userAnswer && option !== item.answer && '✗'}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Expanded details */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t space-y-2"
                      >
                        <div>
                          <span className="text-xs text-gray-500">Your answer:</span>
                          <p className="text-sm font-medium">
                            {response?.userAnswer || 'No answer recorded'}
                          </p>
                        </div>
                        
                        {item.answer && (
                          <div>
                            <span className="text-xs text-gray-500">Correct answer:</span>
                            <p className="text-sm font-medium text-green-700">
                              {item.answer}
                            </p>
                          </div>
                        )}
                        
                        {item.explanation && (
                          <div>
                            <span className="text-xs text-gray-500">Explanation:</span>
                            <p className="text-sm text-gray-700">
                              {item.explanation}
                            </p>
                          </div>
                        )}
                        
                        {response && (
                          <div>
                            <span className="text-xs text-gray-500">Time spent:</span>
                            <p className="text-sm">
                              {Math.round(response.timeSpent / 1000)}s
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Redo Button */}
        <div className="flex justify-center pt-4 border-t">
          <Button
            onClick={handleRedo}
            className="w-full max-w-sm"
            data-testid="redo-session-button"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Redo 3 Questions
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}