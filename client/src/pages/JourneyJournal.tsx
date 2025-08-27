import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, BookOpen, Clock, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Workbook subjects for 3-5 year olds
const WORKBOOK_SUBJECTS = [
  {
    id: 'literacy',
    name: 'Reading & Letters',
    icon: '📚',
    color: 'from-amber-700 to-amber-500',
    description: 'Letters, sounds, and first words',
    skills: ['Letter Recognition', 'Phonics', 'Simple Words']
  },
  {
    id: 'mathematics',
    name: 'Numbers & Shapes',
    icon: '🔢',
    color: 'from-emerald-700 to-emerald-500', 
    description: 'Counting, shapes, and patterns',
    skills: ['Counting 1-10', 'Shape Recognition', 'Simple Patterns']
  },
  {
    id: 'science',
    name: 'Discovering Nature',
    icon: '🌱',
    color: 'from-blue-700 to-blue-500',
    description: 'Nature, animals, and experiments',
    skills: ['Living Things', 'Weather', 'Simple Science']
  },
  {
    id: 'art',
    name: 'Creating & Drawing',
    icon: '🎨',
    color: 'from-purple-700 to-purple-500',
    description: 'Colors, creativity, and expression',
    skills: ['Color Mixing', 'Drawing Skills', 'Creative Expression']
  }
];

interface JourneyJournalProps {
  studentName: string;
  studentId: string;
}

export default function JourneyJournal({ studentName, studentId }: JourneyJournalProps) {
  const [, setLocation] = useLocation();
  const [currentSubject, setCurrentSubject] = useState<string | null>(null);
  const [scoutMessage, setScoutMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate Scout's welcome message
    setScoutMessage(`Welcome back to your Journey Journal, ${studentName}! I'm so excited to learn with you today. What would you like to explore?`);
    setIsLoading(false);
  }, [studentName]);

  const handleBackToMap = () => {
    setLocation('/quest-island');
  };

  const handleSubjectSelect = (subjectId: string) => {
    setCurrentSubject(subjectId);
  };

  const handleStartSession = (subject: string) => {
    // Start a new workbook session
    setLocation(`/journey-journal/session/${subject}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-amber-600 animate-pulse mx-auto mb-4" />
          <p className="text-amber-800 text-lg">Opening your Journey Journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(217, 119, 6, 0.1) 0%, transparent 50%)
        `
      }}
    >
      {/* Header with back button and Scout */}
      <div className="relative p-6">
        <Button 
          onClick={handleBackToMap}
          variant="ghost" 
          className="absolute left-6 top-6 text-amber-800 hover:text-amber-600 hover:bg-amber-100"
          data-testid="button-back-to-map"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Quest Island
        </Button>
        
        {/* Scout's Message */}
        <div className="max-w-2xl mx-auto text-center mt-12">
          <div className="relative">
            {/* Scout Character */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl">🎒</span>
            </div>
            
            {/* Scout's Speech Bubble */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-amber-200 relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-4 border-t-4 border-amber-200 rotate-45"></div>
              <p className="text-amber-900 text-lg font-medium leading-relaxed" data-testid="text-scout-message">
                {scoutMessage}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Journal Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-900 mb-2 tracking-wide">
          {studentName}'s Journey Journal
        </h1>
        <p className="text-amber-700 text-lg">
          Choose your learning adventure
        </p>
      </div>

      {/* Subject Selection - Leather Journal Pages */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {WORKBOOK_SUBJECTS.map((subject) => (
            <Card 
              key={subject.id}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-amber-200 rounded-3xl overflow-hidden"
              style={{
                background: `
                  linear-gradient(145deg, #fef7ed 0%, #fed7aa 100%),
                  linear-gradient(45deg, transparent 40%, rgba(245, 158, 11, 0.1) 50%, transparent 60%)
                `,
                boxShadow: `
                  inset 0 1px 0 rgba(255, 255, 255, 0.8),
                  inset 0 -1px 0 rgba(217, 119, 6, 0.2),
                  0 10px 20px rgba(217, 119, 6, 0.2)
                `
              }}
              onClick={() => handleSubjectSelect(subject.id)}
              data-testid={`card-subject-${subject.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{subject.icon}</span>
                    <div>
                      <CardTitle className="text-xl text-amber-900 group-hover:text-amber-700 transition-colors">
                        {subject.name}
                      </CardTitle>
                      <p className="text-amber-600 text-sm mt-1">{subject.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <Star className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-amber-700 mb-2">
                    <span>Progress</span>
                    <span>2 of 3 skills</span>
                  </div>
                  <Progress value={66} className="h-2 bg-amber-100" />
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {subject.skills.map((skill, index) => (
                    <Badge 
                      key={skill}
                      variant={index < 2 ? "default" : "secondary"}
                      className={`text-xs ${index < 2 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-100 text-amber-600 border-amber-200'
                      }`}
                    >
                      {index < 2 && <CheckCircle className="h-3 w-3 mr-1" />}
                      {skill}
                    </Badge>
                  ))}
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartSession(subject.id);
                  }}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                  data-testid={`button-start-${subject.id}`}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Start Learning Session
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Journal binding effect */}
      <div className="fixed left-0 top-0 w-8 h-full bg-gradient-to-r from-amber-800 to-amber-600 shadow-lg">
        <div className="h-full flex flex-col justify-evenly px-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-4 h-1 bg-amber-900 rounded-full opacity-40" />
          ))}
        </div>
      </div>
    </div>
  );
}