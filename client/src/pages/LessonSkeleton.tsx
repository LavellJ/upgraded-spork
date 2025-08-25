import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LessonRenderer from '../components/LessonRenderer';
import { sampleLessons } from '../data/sampleLessons';

const DEMO_STUDENT_ID = 'demo-student';

export default function LessonSkeleton() {
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [showSelector, setShowSelector] = useState(true);
  const queryClient = useQueryClient();
  
  // Fetch lesson completions from API
  const { data: lessonCompletions = [] } = useQuery({
    queryKey: [`/api/lesson-completions/${DEMO_STUDENT_ID}`],
  });
  
  // Convert lesson completions to a set of completed lesson indices
  const completedLessons = new Set(
    (lessonCompletions as any[])
      .filter((completion: any) => completion.isCorrect)
      .map((completion: any) => {
        const lessonIndex = sampleLessons.findIndex(lesson => lesson.lessonId === completion.lessonId);
        return lessonIndex >= 0 ? lessonIndex : null;
      })
      .filter((index: number | null) => index !== null)
  );

  const currentLesson = sampleLessons[selectedLessonIndex];
  const progress = ((selectedLessonIndex + 1) / sampleLessons.length) * 100;

  const handleLessonComplete = () => {
    // Invalidate queries to refetch updated data
    queryClient.invalidateQueries({ queryKey: [`/api/lesson-completions/${DEMO_STUDENT_ID}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/achievements/${DEMO_STUDENT_ID}`] });
    
    // Move to next lesson if available
    if (selectedLessonIndex < sampleLessons.length - 1) {
      setSelectedLessonIndex(selectedLessonIndex + 1);
    } else {
      // All lessons completed, show selector
      setShowSelector(true);
    }
  };

  const handleSelectLesson = (index: number) => {
    setSelectedLessonIndex(index);
    setShowSelector(false);
  };

  if (showSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🏴‍☠️ Scout's Adventure Lessons
            </h1>
            <p className="text-lg text-gray-600">
              Choose a lesson to start your learning adventure with Scout!
            </p>
          </motion.div>

          {/* Progress Overview */}
          <motion.div
            className="bg-white rounded-2xl p-6 mb-8 shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4">Learning Progress</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(completedLessons.size / sampleLessons.length) * 100}%` }}
                />
              </div>
              <span className="font-medium text-gray-700">
                {completedLessons.size}/{sampleLessons.length} Complete
              </span>
            </div>
          </motion.div>

          {/* Lesson Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleLessons.map((lesson, index) => (
              <motion.div
                key={lesson.lessonId}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectLesson(index)}
              >
                {/* Lesson Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      lesson.subject === 'Math' ? 'bg-blue-100 text-blue-800' :
                      lesson.subject === 'English' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {lesson.subject}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {lesson.level}
                    </span>
                  </div>
                  {completedLessons.has(index) && (
                    <div className="text-green-500 text-xl">✅</div>
                  )}
                </div>

                {/* Lesson Preview */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Lesson {index + 1}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {lesson.scoutIntro.substring(0, 80)}...
                  </p>
                </div>

                {/* Challenge Type */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="capitalize">{lesson.challengeType.replace(/([A-Z])/g, ' $1')}</span>
                  <span>•</span>
                  <span>{lesson.challengeType === 'multipleChoice' ? '🤔' : 
                         lesson.challengeType === 'fillBlank' ? '✏️' : '🎯'}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Back to Main App */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-2xl transition-all"
            >
              ← Back to Main App
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back to Selector Button */}
      <button
        onClick={() => setShowSelector(true)}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl shadow-lg transition-all"
      >
        ← Lessons
      </button>

      <LessonRenderer 
        lesson={currentLesson}
        onComplete={handleLessonComplete}
        progress={progress}
        studentId={DEMO_STUDENT_ID}
      />
    </div>
  );
}