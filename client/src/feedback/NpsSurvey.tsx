// client/src/feedback/NpsSurvey.tsx
import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Slider } from '../components/ui/slider';
import { X, Heart, MessageSquare } from 'lucide-react';
import { recordNps, snoozeNps } from './nps';

interface NpsSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  learnerId?: string;
}

export function NpsSurvey({ isOpen, onClose, learnerId }: NpsSurveyProps) {
  const [score, setScore] = useState([5]); // Slider component expects array
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentScore = score[0];

  // Score interpretation for user feedback
  const getScoreLabel = (score: number) => {
    if (score >= 9) return { text: "Love it!", icon: "🎉", color: "text-green-600" };
    if (score >= 7) return { text: "Pretty good", icon: "😊", color: "text-blue-600" };
    if (score >= 5) return { text: "It's okay", icon: "😐", color: "text-yellow-600" };
    if (score >= 3) return { text: "Could be better", icon: "😕", color: "text-orange-600" };
    return { text: "Not great", icon: "😞", color: "text-red-600" };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      recordNps(currentScore, learnerId, note.trim() || undefined);
      setSubmitted(true);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit NPS:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Mark as snoozed if user closes without answering
    snoozeNps(learnerId);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setScore([5]);
    setNote('');
    setSubmitted(false);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  const scoreLabel = getScoreLabel(currentScore);

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-end sm:items-center sm:justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl border border-stone-200 animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0 sm:fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Quick feedback</h3>
              <p className="text-sm text-stone-600">Help us improve LearnOz</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="w-8 h-8 p-0 rounded-full hover:bg-stone-100"
            data-testid="nps-survey-close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {submitted ? (
          /* Success State */
          <div className="px-6 pb-6 text-center">
            <div className="text-4xl mb-3">🙏</div>
            <h4 className="font-semibold text-stone-900 mb-2">Thank you!</h4>
            <p className="text-sm text-stone-600">Your feedback helps us make LearnOz better for everyone.</p>
          </div>
        ) : (
          /* Survey Form */
          <div className="px-6 pb-6">
            {/* Question */}
            <div className="mb-6">
              <h4 className="font-medium text-stone-900 mb-2">
                How likely are you to recommend LearnOz for your class?
              </h4>
              <p className="text-sm text-stone-600">
                Please rate from 0 (not likely) to 10 (very likely)
              </p>
            </div>

            {/* Score Slider */}
            <div className="mb-6">
              <div className="mb-4">
                <Slider
                  value={score}
                  onValueChange={setScore}
                  max={10}
                  min={0}
                  step={1}
                  className="w-full"
                  data-testid="nps-score-slider"
                />
              </div>
              
              {/* Score Display */}
              <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
                <span>0 - Not likely</span>
                <span>10 - Very likely</span>
              </div>
              
              {/* Current Score Feedback */}
              <div className="text-center">
                <div className="text-2xl mb-1">{scoreLabel.icon}</div>
                <div className={`text-sm font-medium ${scoreLabel.color}`}>
                  Score: {currentScore}/10 - {scoreLabel.text}
                </div>
              </div>
            </div>

            {/* Optional Note */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                <MessageSquare className="w-4 h-4" />
                Tell us more (optional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What could we improve? What do you love?"
                rows={3}
                className="resize-none text-sm"
                data-testid="nps-note-input"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              data-testid="nps-submit-button"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                'Send feedback'
              )}
            </Button>
            
            {/* Skip Option */}
            <button
              onClick={handleClose}
              className="w-full mt-3 text-sm text-stone-500 hover:text-stone-600 transition-colors"
              data-testid="nps-skip-button"
            >
              Maybe later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}