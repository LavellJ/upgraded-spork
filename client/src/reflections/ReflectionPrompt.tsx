import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { MessageCircle, X, Check } from 'lucide-react';
import { saveReflection } from './model';
import type { Reflection } from './model';

interface ReflectionPromptProps {
  open: boolean;
  onClose: () => void;
  refType: 'lesson' | 'journal';
  refId: string; // lesson ID or skill ID
  className?: string;
}

export function ReflectionPrompt({ 
  open, 
  onClose, 
  refType, 
  refId, 
  className = '' 
}: ReflectionPromptProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (note.trim().length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reflection: Reflection = {
        at: Date.now(),
        refType,
        refId,
        note: note.trim()
      };
      
      saveReflection(reflection);
      
      // Small delay to show success state
      setTimeout(() => {
        setNote('');
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to save reflection:', error);
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleSkip = () => {
    setNote('');
    onClose();
  };

  const activityType = refType === 'lesson' ? 'lesson' : 'practice session';
  const remainingChars = 140 - note.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-4 right-4 z-50 w-80 ${className}`}
          data-testid="reflection-prompt"
        >
          <Card className="shadow-lg border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    Quick Reflection
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    What felt easy or tricky about this {activityType}?
                  </p>
                  
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 140))}
                    placeholder="Share your thoughts... (optional)"
                    className="text-sm min-h-[60px] resize-none"
                    disabled={isSubmitting}
                    data-testid="reflection-input"
                  />
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${remainingChars < 10 ? 'text-red-500' : 'text-gray-400'}`}>
                      {remainingChars} chars left
                    </span>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="text-xs h-7 px-2"
                        data-testid="skip-reflection-button"
                      >
                        Skip
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="text-xs h-7 px-2"
                        data-testid="save-reflection-button"
                      >
                        {isSubmitting ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 p-1 h-6 w-6"
                  data-testid="close-reflection-button"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}