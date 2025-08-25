import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ScoutSpeechButton } from './ScoutSpeechButton';
import { apiRequest } from '@/lib/queryClient';
import { Badge, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LessonData {
  lessonId: string;
  subject: string;
  level: string;
  scoutIntro: string;
  challengeType: "multipleChoice" | "fillBlank" | "dragDrop";
  challengeContent: {
    question?: string;
    options?: string[];
    answer?: string | string[];
    sentence?: string;
    pairs?: Array<{ item: string; match: string }>;
  };
  feedback: {
    correct: string;
    incorrect: string;
  };
  reward: {
    type: string;
    description: string;
  };
}

interface LessonRendererProps {
  lesson: LessonData;
  onComplete?: () => void;
  progress?: number;
  studentId?: string;
}

interface BadgeNotification {
  id: string;
  badgeId: string;
  metadata: {
    badgeName: string;
    category: string;
    rarity: string;
  };
}

export default function LessonRenderer({ lesson, onComplete, progress = 0, studentId = "demo-student" }: LessonRendererProps) {
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [fillBlankInputs, setFillBlankInputs] = useState<string[]>([]);
  const [newBadges, setNewBadges] = useState<BadgeNotification[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  
  const queryClient = useQueryClient();
  
  const lessonCompletionMutation = useMutation({
    mutationFn: async (completionData: {
      studentId: string;
      lessonId: string;
      subject: string;
      challengeType: string;
      isCorrect: boolean;
    }) => {
      const response = await apiRequest('POST', '/api/lesson-completion', completionData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.newBadges && data.newBadges.length > 0) {
        setNewBadges(data.newBadges);
        setShowBadgeModal(true);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/lesson-completions', studentId] });
    },
  });

  const checkAnswer = (answer: any) => {
    let correct = false;

    if (lesson.challengeType === "multipleChoice") {
      correct = answer === lesson.challengeContent.answer;
    }

    if (lesson.challengeType === "fillBlank") {
      correct = Array.isArray(lesson.challengeContent.answer)
        ? JSON.stringify(answer) === JSON.stringify(lesson.challengeContent.answer)
        : answer === lesson.challengeContent.answer;
    }

    if (lesson.challengeType === "dragDrop") {
      correct = JSON.stringify(answer) === JSON.stringify(lesson.challengeContent.pairs);
    }

    setUserAnswer(answer);
    setIsCorrect(correct);
    
    if (correct) {
      setTimeout(() => setShowReward(true), 800);
    }
  };

  const handleHint = () => {
    setHintShown(true);
  };

  const handleNext = () => {
    // Only record lesson completion when advancing to next lesson after correct answer
    if (isCorrect) {
      lessonCompletionMutation.mutate({
        studentId,
        lessonId: lesson.lessonId,
        subject: lesson.subject,
        challengeType: lesson.challengeType,
        isCorrect: true
      });
    }
    
    if (onComplete) {
      onComplete();
    }
  };

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      <p className="text-lg font-medium text-gray-800 mb-4">{lesson.challengeContent.question}</p>
      {lesson.challengeContent.options?.map((option, index) => (
        <motion.button
          key={index}
          onClick={() => checkAnswer(option)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full p-4 rounded-2xl text-left font-medium transition-all shadow-sm ${
            userAnswer === option
              ? isCorrect
                ? 'bg-green-100 border-2 border-green-400 text-green-800'
                : 'bg-red-100 border-2 border-red-400 text-red-800'
              : 'bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300'
          }`}
          data-testid={`option-${index}`}
        >
          {option}
        </motion.button>
      ))}
    </div>
  );

  const renderFillBlank = () => {
    const sentence = lesson.challengeContent.sentence || "";
    const blanks = sentence.split("_");
    const expectedAnswers = Array.isArray(lesson.challengeContent.answer) 
      ? lesson.challengeContent.answer 
      : [lesson.challengeContent.answer];

    return (
      <div className="space-y-4">
        <div className="text-lg leading-relaxed">
          {blanks.map((part, index) => (
            <span key={index}>
              {part}
              {index < blanks.length - 1 && (
                <input
                  type="text"
                  className="mx-2 px-3 py-1 border-2 border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none min-w-16 text-center"
                  onChange={(e) => {
                    const newInputs = [...fillBlankInputs];
                    newInputs[index] = e.target.value;
                    setFillBlankInputs(newInputs);
                  }}
                  data-testid={`fill-blank-${index}`}
                />
              )}
            </span>
          ))}
        </div>
        <button
          onClick={() => checkAnswer(fillBlankInputs)}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-2xl transition-all"
          data-testid="submit-fill-blank"
        >
          Check Answer
        </button>
      </div>
    );
  };

  const renderDragDrop = () => (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-800">{lesson.challengeContent.question || "Match each item with its pair:"}</p>
      <div className="text-gray-600 mb-4">🔧 Drag-drop UI coming soon!</div>
      
      {/* Simplified matching for now */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Items:</h4>
          {lesson.challengeContent.pairs?.map((pair, index) => (
            <div key={index} className="p-3 bg-blue-100 rounded-lg">
              {pair.item}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Matches:</h4>
          {lesson.challengeContent.pairs?.map((pair, index) => (
            <div key={index} className="p-3 bg-green-100 rounded-lg">
              {pair.match}
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={() => checkAnswer(lesson.challengeContent.pairs)}
        className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-2xl transition-all"
        data-testid="check-matches"
      >
        Check Matches
      </button>
    </div>
  );

  const renderChallenge = () => {
    switch (lesson.challengeType) {
      case "multipleChoice":
        return renderMultipleChoice();
      case "fillBlank":
        return renderFillBlank();
      case "dragDrop":
        return renderDragDrop();
      default:
        return <p className="text-gray-500">Unsupported challenge type.</p>;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      {/* Progress Bar Header */}
      <div className="w-full bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">Progress:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(100vh-100px)]">
        
        {/* Left Side: Scout & Background Scene */}
        <div className="relative">
          <motion.div
            className="bg-gradient-to-b from-green-200 to-green-400 rounded-3xl p-8 h-full min-h-96 relative overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Background Scene Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Simple tree shapes */}
              <div className="absolute bottom-0 left-4 w-8 h-16 bg-amber-600 rounded-t-full"></div>
              <div className="absolute bottom-0 right-8 w-6 h-12 bg-amber-600 rounded-t-full"></div>
              {/* Clouds */}
              <div className="absolute top-4 left-8 w-12 h-6 bg-white rounded-full opacity-80"></div>
              <div className="absolute top-8 right-12 w-8 h-4 bg-white rounded-full opacity-60"></div>
            </div>

            {/* Scout Character */}
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              animate={{ 
                y: [0, -8, 0],
                rotate: [-2, 2, -2]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-24 h-24 bg-orange-400 rounded-full flex items-center justify-center text-4xl shadow-lg">
                🦘
              </div>
            </motion.div>

            {/* Scout's Speech Bubble */}
            <motion.div
              className="absolute top-8 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="flex items-start gap-3">
                <ScoutSpeechButton 
                  text={lesson.scoutIntro}
                  autoSpeak={true}
                />
                <p className="text-sm font-medium text-gray-800 leading-relaxed">
                  {lesson.scoutIntro}
                </p>
              </div>
              
              {/* Speech bubble tail */}
              <div className="absolute bottom-0 left-8 transform translate-y-full">
                <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white"></div>
              </div>
            </motion.div>

            {/* Reward Stars */}
            <AnimatePresence>
              {showReward && (
                <motion.div
                  className="absolute top-4 right-4"
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0, rotate: 180 }}
                  transition={{ duration: 0.8, type: "spring" }}
                >
                  <div className="text-4xl">⭐</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Side: Lesson Content */}
        <motion.div
          className="bg-white rounded-3xl shadow-lg p-8"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="space-y-6">
            {/* Subject & Level */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {lesson.subject}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {lesson.level}
              </span>
            </div>

            {/* Challenge */}
            <div>
              {renderChallenge()}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {isCorrect !== null && (
                <motion.div
                  className={`p-4 rounded-2xl ${
                    isCorrect ? 'bg-green-100 border-2 border-green-200' : 'bg-red-100 border-2 border-red-200'
                  }`}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.4 }}
                  data-testid="feedback"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {isCorrect ? '🎉' : '🤔'}
                    </div>
                    <p className={`font-medium ${
                      isCorrect ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {isCorrect ? lesson.feedback.correct : lesson.feedback.incorrect}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reward */}
            <AnimatePresence>
              {showReward && (
                <motion.div
                  className="text-center p-6 bg-gradient-to-br from-yellow-50 to-green-50 border-2 border-yellow-200 rounded-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  data-testid="reward"
                >
                  <div className="text-4xl mb-3">🌟</div>
                  <p className="font-medium text-yellow-800 mb-4">{lesson.reward.description}</p>
                  <motion.button
                    onClick={handleNext}
                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all shadow-lg"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    data-testid="next-button-inline"
                  >
                    Continue Adventure! 🚀
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Footer Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex justify-center gap-4">
          {!isCorrect && userAnswer && (
            <button
              onClick={handleHint}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-2xl transition-all"
              data-testid="hint-button"
            >
              💡 Hint
            </button>
          )}
          
          {isCorrect && !showReward && (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-2xl transition-all"
              data-testid="next-button"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Badge Award Modal */}
    <Dialog open={showBadgeModal} onOpenChange={setShowBadgeModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            New Badge Earned!
          </DialogTitle>
          <DialogDescription>
            Congratulations! You've earned {newBadges.length} new badge{newBadges.length !== 1 ? 's' : ''}!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {newBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="flex-shrink-0">
                <Badge className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{badge.metadata.badgeName}</h3>
                <p className="text-sm text-gray-600 capitalize">
                  {badge.metadata.rarity} • {badge.metadata.category}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center">
          <Button 
            onClick={() => setShowBadgeModal(false)}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            Awesome! Keep Learning 🌟
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}