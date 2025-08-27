import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, BookOpen, Clock, Star, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

// Workbook subjects with Alto's Adventure aesthetics
const WORKBOOK_SUBJECTS = [
  {
    id: 'literacy',
    name: 'The Written Path',
    icon: '✒️',
    gradient: 'from-slate-600 via-slate-500 to-slate-400',
    bgGradient: 'from-slate-100 via-slate-50 to-white',
    atmosphere: 'from-slate-200/20 to-slate-300/10',
    description: 'Journey through letters, sounds, and the magic of words',
    skills: ['Letter Discovery', 'Sound Patterns', 'Word Building'],
    scoutMessage: 'Let\'s explore the beautiful world of letters together! Each one tells a story.'
  },
  {
    id: 'mathematics',
    name: 'The Number Mountain',
    icon: '▲',
    gradient: 'from-blue-600 via-blue-500 to-blue-400',
    bgGradient: 'from-blue-50 via-sky-50 to-white',
    atmosphere: 'from-blue-200/20 to-sky-300/10',
    description: 'Scale the peaks of counting, shapes, and mathematical wonder',
    skills: ['Number Paths', 'Shape Discoveries', 'Pattern Adventures'],
    scoutMessage: 'Numbers are like stepping stones up a mountain. Let\'s climb together!'
  },
  {
    id: 'science',
    name: 'The Living Valley',
    icon: '🌿',
    gradient: 'from-emerald-600 via-green-500 to-emerald-400',
    bgGradient: 'from-emerald-50 via-green-50 to-white',
    atmosphere: 'from-emerald-200/20 to-green-300/10',
    description: 'Discover the wonders of nature, life, and the world around us',
    skills: ['Nature Watching', 'Life Cycles', 'Wonder Moments'],
    scoutMessage: 'Nature is full of amazing secrets waiting to be discovered. Come explore with me!'
  },
  {
    id: 'art',
    name: 'The Creative Canyon',
    icon: '🎭',
    gradient: 'from-purple-600 via-violet-500 to-purple-400',
    bgGradient: 'from-purple-50 via-violet-50 to-white',
    atmosphere: 'from-purple-200/20 to-violet-300/10',
    description: 'Express yourself through colors, shapes, and creative imagination',
    skills: ['Color Journeys', 'Shape Stories', 'Creative Flow'],
    scoutMessage: 'Creativity flows like water through a canyon. Let\'s make something beautiful!'
  }
];

interface JourneyJournalProps {
  studentName: string;
  studentId: string;
}

export default function JourneyJournal({ studentName, studentId }: JourneyJournalProps) {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(0); // Current journal page (0 = cover, 1-4 = subjects)
  const [scoutMessage, setScoutMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Generate Scout's welcome message
    if (currentPage === 0) {
      setScoutMessage(`Welcome to your Journey Journal, ${studentName}! This is where we'll go on learning adventures together. Ready to explore?`);
    } else {
      const subject = WORKBOOK_SUBJECTS[currentPage - 1];
      setScoutMessage(subject.scoutMessage);
    }
    setIsLoading(false);
    setIsMounted(true);
  }, [studentName, currentPage]);

  const handleBackToMap = () => {
    setLocation('/quest-island');
  };

  const handleNextPage = () => {
    if (currentPage < WORKBOOK_SUBJECTS.length) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleStartSession = (subject: string) => {
    setLocation(`/journey-journal/session/${subject}`);
  };

  const handlePageNavigation = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-amber-600 animate-pulse mx-auto mb-4" />
          <p className="text-amber-800 text-lg">Opening your Journey Journal...</p>
        </div>
      </div>
    );
  }

  // Get current subject for individual pages
  const currentSubject = currentPage > 0 ? WORKBOOK_SUBJECTS[currentPage - 1] : null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background - Changes per page */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ${
          currentPage === 0 
            ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50' 
            : `bg-gradient-to-br ${currentSubject?.bgGradient}`
        }`}
      >
        {/* Atmospheric layers */}
        <div 
          className={`absolute inset-0 ${
            currentPage === 0 
              ? 'bg-gradient-to-r from-amber-100/30 via-transparent to-orange-100/30' 
              : `bg-gradient-to-r ${currentSubject?.atmosphere}`
          }`} 
        />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Fixed Navigation Header */}
      <div className="relative z-30 p-6">
        <div className="flex justify-between items-center">
          <Button 
            onClick={handleBackToMap}
            variant="ghost" 
            className="text-slate-700 hover:text-slate-900 hover:bg-white/30 backdrop-blur-sm"
            data-testid="button-back-to-map"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Quest Island
          </Button>

          {/* Page indicator dots */}
          <div className="flex items-center space-x-2">
            {[0, ...Array.from({ length: WORKBOOK_SUBJECTS.length }, (_, i) => i + 1)].map((pageIndex) => (
              <Button
                key={pageIndex}
                variant="ghost"
                size="sm"
                onClick={() => handlePageNavigation(pageIndex)}
                className={`w-3 h-3 rounded-full p-0 transition-all duration-300 ${
                  currentPage === pageIndex
                    ? 'bg-slate-600 hover:bg-slate-700'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                data-testid={`nav-dot-${pageIndex}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Page Content with AnimatePresence */}
      <div className="relative z-20">
        <AnimatePresence mode="wait">
          {currentPage === 0 ? (
            // COVER PAGE
            <motion.div
              key="cover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center justify-center min-h-screen px-6"
            >
              {/* Scout Character - Large */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mb-8"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-amber-300">
                  <span className="text-6xl">🎒</span>
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-center mb-8"
              >
                <h1 className="text-6xl font-bold text-slate-800 mb-4 tracking-wide">
                  Journey Journal
                </h1>
                <h2 className="text-3xl text-slate-600 font-medium">
                  {studentName}'s Learning Adventure
                </h2>
              </motion.div>

              {/* Scout's Welcome Message */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="max-w-2xl text-center mb-12"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-amber-200">
                  <p className="text-slate-700 text-xl leading-relaxed" data-testid="text-scout-message">
                    {scoutMessage}
                  </p>
                </div>
              </motion.div>

              {/* Start Button */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
              >
                <Button
                  onClick={handleNextPage}
                  className="px-12 py-6 text-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                  data-testid="button-start-journey"
                >
                  Begin Your Journey
                  <ChevronRight className="h-6 w-6 ml-3" />
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            // SUBJECT PAGES
            <motion.div
              key={`page-${currentPage}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center justify-center min-h-screen px-6"
            >
              {currentSubject && (
                <>
                  {/* Subject Hero Section */}
                  <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-center mb-12"
                  >
                    <div className={`inline-block p-8 rounded-3xl bg-gradient-to-r ${currentSubject.gradient} shadow-2xl mb-6`}>
                      <span className="text-8xl text-white">{currentSubject.icon}</span>
                    </div>
                    <h1 className="text-5xl font-bold text-slate-800 mb-4">
                      {currentSubject.name}
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl">
                      {currentSubject.description}
                    </p>
                  </motion.div>

                  {/* Scout's Guidance */}
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="flex items-center space-x-6 mb-12 max-w-4xl"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center shadow-lg border-4 border-amber-300">
                      <span className="text-3xl">🎒</span>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 flex-1">
                      <p className="text-slate-700 text-lg leading-relaxed" data-testid="text-scout-message">
                        {scoutMessage}
                      </p>
                    </div>
                  </motion.div>

                  {/* Skills & Progress */}
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mb-12"
                  >
                    <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Learning Adventures</h3>
                    <div className="flex justify-center space-x-4">
                      {currentSubject.skills.map((skill, index) => (
                        <Badge
                          key={skill}
                          className={`px-4 py-2 text-sm font-medium ${
                            index < 2 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {index < 2 && <CheckCircle className="h-4 w-4 mr-2" />}
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>

                  {/* Action Button */}
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                  >
                    <Button
                      onClick={() => handleStartSession(currentSubject.id)}
                      className={`px-12 py-6 text-xl bg-gradient-to-r ${currentSubject.gradient} hover:shadow-2xl text-white rounded-2xl shadow-xl transform transition-all duration-300 hover:scale-105`}
                      data-testid={`button-start-${currentSubject.id}`}
                    >
                      <Clock className="h-6 w-6 mr-3" />
                      Start Learning Session
                    </Button>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            variant="ghost"
            size="lg"
            className="text-slate-600 hover:text-slate-800 disabled:opacity-30"
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <span className="text-slate-600 font-medium px-4">
            {currentPage === 0 ? 'Cover' : `${currentSubject?.name}`}
          </span>
          
          <Button
            onClick={handleNextPage}
            disabled={currentPage === WORKBOOK_SUBJECTS.length}
            variant="ghost"
            size="lg"
            className="text-slate-600 hover:text-slate-800 disabled:opacity-30"
            data-testid="button-next-page"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Journal binding effect */}
      <div className="fixed left-0 top-0 w-8 h-full bg-gradient-to-r from-amber-800 to-amber-600 shadow-lg z-10">
        <div className="h-full flex flex-col justify-evenly px-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-4 h-1 bg-amber-900 rounded-full opacity-40" />
          ))}
        </div>
      </div>
    </div>
  );
}