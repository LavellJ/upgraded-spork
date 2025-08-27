import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Clock, CheckCircle, XCircle, Heart, Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface WorkbookQuestion {
  id: string;
  question: string;
  questionType: string;
  options?: string[] | null;
  correctAnswer: any;
  explanation?: string | null;
  tags: string[];
}

interface WorkbookSession {
  id: string;
  studentId: string;
  subject: string;
  startTime: string;
  endTime?: string | null;
  questionsAsked: number;
  questionsCorrect: number;
  isCompleted: boolean;
}

export default function WorkbookSession() {
  const params = useParams<{ subject: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [currentSession, setCurrentSession] = useState<WorkbookSession | null>(null);
  const [questions, setQuestions] = useState<WorkbookQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0); // in seconds
  const [scoutMessage, setScoutMessage] = useState('');

  // Mock student data - in real app this would come from auth/context
  const studentId = 'student-1';
  const studentName = 'Explorer';
  const ageGroup = 'pre-primary';
  
  const subject = params?.subject || 'mathematics';

  // Timer effect for session duration
  useEffect(() => {
    if (currentSession && !currentSession.isCompleted) {
      const interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentSession]);

  // Generate questions mutation
  const generateQuestions = useMutation({
    mutationFn: async (data: {
      subject: string;
      ageGroup: string;
      difficulty?: number;
      count?: number;
    }) => {
      const response = await apiRequest('POST', '/api/workbook/questions/generate', data);
      return await response.json();
    },
    onSuccess: (data) => {
      setQuestions(data);
    },
  });

  // Create session mutation
  const createSession = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest('POST', '/api/workbook/sessions', sessionData);
      return await response.json();
    },
    onSuccess: (session) => {
      setCurrentSession(session);
    },
  });

  // Submit response mutation
  const submitResponse = useMutation({
    mutationFn: async (responseData: any) => {
      const response = await apiRequest('POST', '/api/workbook/responses', responseData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workbook/progress', studentId] });
    },
  });

  // Initialize session and questions
  useEffect(() => {
    const initializeSession = async () => {
      // Create a new session
      createSession.mutate({
        studentId,
        subject,
        targetDuration: 900, // 15 minutes default
        difficultyLevel: 3,
        ageGroup,
        isCompleted: false,
      });

      // Generate questions
      generateQuestions.mutate({
        subject,
        ageGroup,
        difficulty: 3,
        count: 5,
      });
    };

    initializeSession();
    setScoutMessage(`Let's explore ${subject} together! Take your time and think carefully.`);
  }, [subject]);

  const handleAnswerSelect = (answer: any) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!currentSession || !questions[currentQuestionIndex] || selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Submit response to backend
    submitResponse.mutate({
      sessionId: currentSession.id,
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect: correct,
      responseTime: Math.floor(Math.random() * 30) + 10, // Mock response time
    });

    // Update Scout's message
    if (correct) {
      const encouragement = [
        "Fantastic work! You're really getting the hang of this!",
        "Brilliant! I knew you could figure it out!",
        "Amazing! You're such a smart explorer!",
        "Perfect! We're learning so much together!"
      ];
      setScoutMessage(encouragement[Math.floor(Math.random() * encouragement.length)]);
    } else {
      const supportive = [
        "That's okay! Learning means trying new things together.",
        "Good try! Let's look at this together and learn.",
        "We're exploring together - every try helps us learn!",
        "That's alright! We'll figure this out as a team."
      ];
      setScoutMessage(supportive[Math.floor(Math.random() * supportive.length)]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setScoutMessage("Let's try the next one together! You're doing great!");
    } else {
      // Session completed
      setScoutMessage("Wow! You completed your learning session! I'm so proud of how hard you worked!");
      completeSession();
    }
  };

  const completeSession = () => {
    if (!currentSession) return;
    
    // Update session as completed
    // In real implementation, this would call API to update session
    setCurrentSession(prev => prev ? { ...prev, isCompleted: true } : null);
    
    setTimeout(() => {
      setLocation('/journey-journal');
    }, 3000);
  };

  const handleBackToJournal = () => {
    setLocation('/journey-journal');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (!currentSession || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-amber-600 animate-pulse mx-auto mb-4" />
          <p className="text-amber-800 text-lg">Preparing your learning session...</p>
        </div>
      </div>
    );
  }

  // Session completed state
  if (currentSession.isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8 bg-white/90 backdrop-blur-sm border-4 border-emerald-200 rounded-3xl shadow-2xl">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-emerald-900 mb-2">Session Complete!</h2>
            <p className="text-emerald-700 text-lg">{scoutMessage}</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
              <span className="text-emerald-800 font-medium">Time Spent:</span>
              <span className="text-emerald-900 font-bold">{formatTime(sessionTimer)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
              <span className="text-emerald-800 font-medium">Questions Answered:</span>
              <span className="text-emerald-900 font-bold">{questions.length}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 relative overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex justify-between items-center">
          <Button 
            onClick={handleBackToJournal}
            variant="ghost" 
            className="text-amber-800 hover:text-amber-600 hover:bg-amber-100"
            data-testid="button-back-to-journal"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Journal
          </Button>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-amber-800">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(sessionTimer)}</span>
            </div>
            <Badge variant="outline" className="text-amber-800 border-amber-300">
              {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 max-w-2xl mx-auto">
          <div className="flex justify-between text-sm text-amber-700 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-3 bg-amber-100" />
        </div>

        {/* Scout's Message */}
        <div className="max-w-2xl mx-auto text-center mt-8">
          <div className="relative">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🎒</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border-3 border-amber-200 relative">
              <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-l-3 border-t-3 border-amber-200 rotate-45"></div>
              <p className="text-amber-900 font-medium" data-testid="text-scout-encouragement">
                {scoutMessage}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <Card className="bg-white/95 backdrop-blur-sm border-4 border-amber-200 rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 border-b-2 border-amber-200">
            <CardTitle className="text-2xl text-amber-900 text-center">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    variant={selectedAnswer === index ? "default" : "outline"}
                    className={`w-full p-6 text-left text-lg rounded-2xl transition-all duration-300 ${
                      selectedAnswer === index
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg transform scale-105'
                        : 'bg-white hover:bg-amber-50 border-2 border-amber-200 text-amber-900 hover:shadow-md'
                    } ${
                      showFeedback && index === currentQuestion.correctAnswer
                        ? 'ring-4 ring-emerald-300 bg-emerald-100'
                        : showFeedback && selectedAnswer === index && !isCorrect
                        ? 'ring-4 ring-red-300 bg-red-100'
                        : ''
                    }`}
                    disabled={showFeedback}
                    data-testid={`button-option-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showFeedback && index === currentQuestion.correctAnswer && (
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      )}
                      {showFeedback && selectedAnswer === index && !isCorrect && (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {currentQuestion.questionType === 'counting' && (
              <div className="text-center">
                <div className="grid grid-cols-5 gap-4 mb-6 justify-center">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <Button
                      key={num}
                      onClick={() => handleAnswerSelect(num)}
                      variant={selectedAnswer === num ? "default" : "outline"}
                      className={`aspect-square text-2xl font-bold rounded-2xl ${
                        selectedAnswer === num
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg transform scale-110'
                          : 'bg-white hover:bg-amber-50 border-2 border-amber-200 text-amber-900'
                      }`}
                      disabled={showFeedback}
                      data-testid={`button-count-${num}`}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            {showFeedback && (
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="flex items-start space-x-3">
                  {isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 mt-1 flex-shrink-0" />
                  ) : (
                    <Heart className="h-6 w-6 text-pink-500 mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-blue-900 font-medium mb-2">
                      {isCorrect ? "Excellent work! " : "Good try! "}
                    </p>
                    {currentQuestion.explanation && (
                      <p className="text-blue-800">{currentQuestion.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center">
              {!showFeedback ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="px-8 py-4 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-submit-answer"
                >
                  Check My Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
                  data-testid="button-next-question"
                >
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>Continue Exploring <Star className="h-5 w-5 ml-2" /></>
                  ) : (
                    <>Complete Session <CheckCircle className="h-5 w-5 ml-2" /></>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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