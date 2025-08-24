import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface Recommendation {
  topicId: string;
  priority: number;
  reasoning: string;
  estimatedTime: string;
  difficulty: number;
  focusAreas: string[];
}

interface LearningPathData {
  recommendations: Recommendation[];
  overallStrategy: string;
  motivationalMessage: string;
}

interface LearningPathRecommendationsProps {
  studentId?: string;
  ageGroup?: "pre-primary" | "primary" | "upper-primary";
  show?: boolean;
  onClose?: () => void;
}

export function LearningPathRecommendations({ 
  studentId = "demo-student", 
  ageGroup = "primary",
  show = false,
  onClose 
}: LearningPathRecommendationsProps) {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  const { data: learningPath, isLoading, error } = useQuery<LearningPathData>({
    queryKey: ["/api/learning-path/recommendations", studentId],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/learning-path/recommendations", {
        studentId
      });
      return response.json();
    },
    enabled: show, // Only fetch when component is shown
  });

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return "from-red-400 to-red-500";
    if (priority >= 4) return "from-orange-400 to-orange-500";
    if (priority >= 3) return "from-amber-400 to-amber-500";
    if (priority >= 2) return "from-blue-400 to-blue-500";
    return "from-gray-400 to-gray-500";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 5) return "High Priority";
    if (priority >= 4) return "Important";
    if (priority >= 3) return "Recommended";
    if (priority >= 2) return "Consider";
    return "Optional";
  };

  const getDifficultyStars = (difficulty: number) => {
    return [...Array(5)].map((_, index) => (
      <svg
        key={index}
        className={`w-3 h-3 ${index < difficulty ? "text-amber-400" : "text-white/20"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-br from-atmospheric-start via-atmospheric-mid to-atmospheric-end 
            rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent-teal to-sky-blue 
                flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Your Learning Journey</h2>
                <p className="text-white/70 text-sm">AI-powered recommendations just for you</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
                data-testid="button-close-recommendations"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3 text-white/80">
                <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>AI is creating your personalised learning path...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-red-200">Unable to generate recommendations. Please try again.</p>
            </div>
          )}

          {learningPath && (
            <div className="space-y-6">
              {/* Motivational Message */}
              {learningPath.motivationalMessage && (
                <motion.div
                  className="bg-gradient-to-r from-accent-teal/20 to-sky-blue/20 rounded-2xl p-6 border border-accent-teal/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-accent-teal flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-accent-teal font-medium mb-2">Personal Message</h3>
                      <p className="text-white/90 leading-relaxed">{learningPath.motivationalMessage}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Overall Strategy */}
              {learningPath.overallStrategy && (
                <motion.div
                  className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Learning Strategy
                  </h3>
                  <p className="text-white/80 leading-relaxed">{learningPath.overallStrategy}</p>
                </motion.div>
              )}

              {/* Recommendations */}
              <div className="space-y-4">
                <h3 className="text-white font-medium text-lg">Recommended Topics</h3>
                {learningPath.recommendations
                  .sort((a, b) => b.priority - a.priority)
                  .map((rec, index) => (
                    <motion.div
                      key={rec.topicId}
                      className="bg-white/10 rounded-2xl overflow-hidden backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <div
                        className="p-6 cursor-pointer"
                        onClick={() => setExpandedRecommendation(
                          expandedRecommendation === rec.topicId ? null : rec.topicId
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getPriorityColor(rec.priority)} text-white text-xs font-medium`}>
                                {getPriorityLabel(rec.priority)}
                              </div>
                              <div className="flex items-center space-x-1">
                                {getDifficultyStars(rec.difficulty)}
                              </div>
                              <span className="text-white/60 text-sm">{rec.estimatedTime}</span>
                            </div>
                            <h4 className="text-white font-medium text-lg mb-2">{rec.topicId}</h4>
                            <p className="text-white/80 text-sm line-clamp-2">{rec.reasoning}</p>
                          </div>
                          <svg
                            className={`w-5 h-5 text-white/60 transition-transform duration-200 ${
                              expandedRecommendation === rec.topicId ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedRecommendation === rec.topicId && (
                          <motion.div
                            className="border-t border-white/20 bg-white/5 p-6"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="space-y-4">
                              <div>
                                <h5 className="text-white font-medium mb-2">Why this topic?</h5>
                                <p className="text-white/80 text-sm leading-relaxed">{rec.reasoning}</p>
                              </div>
                              
                              {rec.focusAreas.length > 0 && (
                                <div>
                                  <h5 className="text-white font-medium mb-2">Focus Areas</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {rec.focusAreas.map((area, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1 bg-accent-teal/20 text-accent-teal rounded-full text-xs border border-accent-teal/30"
                                      >
                                        {area}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}