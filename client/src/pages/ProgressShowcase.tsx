import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { SkillTree } from "@/components/SkillTree";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { australianCurriculumTopics, type CurriculumTopic } from "@/lib/curriculum";
import { Link } from "wouter";

const DEMO_STUDENT_ID = "demo-student";

interface TopicProgress {
  questionsAnswered: number;
  correctAnswers: number;
  isCompleted: boolean;
}

export function ProgressShowcase() {
  const [selectedSubject, setSelectedSubject] = useState<string>("mathematics");
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);
  const [ageGroup, setAgeGroup] = useState<"pre-primary" | "primary" | "upper-primary">("pre-primary");

  // Fetch student data and progress
  const { data: student } = useQuery({
    queryKey: [`/api/students/${DEMO_STUDENT_ID}`],
  });

  const { data: progressData = [] } = useQuery({
    queryKey: [`/api/progress/${DEMO_STUDENT_ID}`],
  });

  const { data: achievements = [] } = useQuery({
    queryKey: [`/api/achievements/${DEMO_STUDENT_ID}`],
  });

  // Set age group from student data
  useEffect(() => {
    if (student && typeof student === 'object' && 'ageGroup' in student && student.ageGroup) {
      setAgeGroup(student.ageGroup as "pre-primary" | "primary" | "upper-primary");
    }
  }, [student]);

  // Process progress data into a usable format
  const processedProgress = (progressData as any[]).reduce((acc: Record<string, TopicProgress>, progress: any) => {
    acc[progress.topicId] = {
      questionsAnswered: progress.questionsAnswered || 0,
      correctAnswers: progress.correctAnswers || 0,
      isCompleted: progress.correctAnswers >= 8 && progress.questionsAnswered >= 10, // Completion criteria
    };
    return acc;
  }, {});

  // Get topics for current age group
  const currentTopics = australianCurriculumTopics[ageGroup] || [];
  
  // Get unique subjects for current age group
  const availableSubjects = Array.from(new Set(currentTopics.map(topic => topic.subject)));

  // Calculate overall statistics
  const getOverallStats = () => {
    const totalTopics = currentTopics.length;
    const completedTopics = currentTopics.filter(topic => 
      processedProgress[topic.id]?.isCompleted
    ).length;
    const inProgressTopics = currentTopics.filter(topic => {
      const progress = processedProgress[topic.id];
      return progress && progress.questionsAnswered > 0 && !progress.isCompleted;
    }).length;

    const totalQuestions = Object.values(processedProgress).reduce((sum: number, p: TopicProgress) => sum + p.questionsAnswered, 0);
    const totalCorrect = Object.values(processedProgress).reduce((sum: number, p: TopicProgress) => sum + p.correctAnswers, 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return {
      totalTopics,
      completedTopics,
      inProgressTopics,
      totalQuestions,
      accuracy,
      badges: (achievements as any[]).length
    };
  };

  const stats = getOverallStats();

  const getAgeGroupDisplayName = () => {
    switch (ageGroup) {
      case "pre-primary": return "Little Learners";
      case "primary": return "Young Explorers";  
      case "upper-primary": return "Advanced Minds";
      default: return ageGroup;
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case "mathematics": return "📊";
      case "literacy": return "📚";
      case "science": return "🔬";
      case "social-studies": return "🌏";
      default: return "📖";
    }
  };

  const handleTopicClick = (topic: CurriculumTopic) => {
    setSelectedTopic(topic);
  };

  const closeTopicModal = () => {
    setSelectedTopic(null);
  };

  return (
    <>
      <AtmosphericBackground />
      <FloatingNavigation />
      
      <div className="relative z-10 min-h-screen pt-24 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/">
            <motion.button 
              className="absolute top-6 left-6 text-white/70 hover:text-white transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-testid="button-back-home"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Learning
            </motion.button>
          </Link>

          <h1 className="font-display text-4xl font-bold text-white mb-2" data-testid="text-progress-title">
            Learning Journey
          </h1>
          <p className="text-white/80 text-lg" data-testid="text-age-group">
            {getAgeGroupDisplayName()} Progress
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="floating-ui rounded-2xl p-4 text-center" data-testid="stat-completed">
            <div className="text-2xl font-bold text-success-green mb-1">{stats.completedTopics}</div>
            <div className="text-white/70 text-sm">Completed</div>
          </div>
          <div className="floating-ui rounded-2xl p-4 text-center" data-testid="stat-in-progress">
            <div className="text-2xl font-bold text-warm-orange mb-1">{stats.inProgressTopics}</div>
            <div className="text-white/70 text-sm">In Progress</div>
          </div>
          <div className="floating-ui rounded-2xl p-4 text-center" data-testid="stat-total">
            <div className="text-2xl font-bold text-accent-teal mb-1">{stats.totalTopics}</div>
            <div className="text-white/70 text-sm">Total Topics</div>
          </div>
          <div className="floating-ui rounded-2xl p-4 text-center" data-testid="stat-questions">
            <div className="text-2xl font-bold text-soft-purple mb-1">{stats.totalQuestions}</div>
            <div className="text-white/70 text-sm">Questions</div>
          </div>
          <div className="floating-ui rounded-2xl p-4 text-center" data-testid="stat-accuracy">
            <div className="text-2xl font-bold text-sky-blue mb-1">{stats.accuracy}%</div>
            <div className="text-white/70 text-sm">Accuracy</div>
          </div>
          <div className="floating-ui rounded-2xl p-4 text-center" data-testid="stat-badges">
            <div className="text-2xl font-bold text-sunset-orange mb-1">{stats.badges}</div>
            <div className="text-white/70 text-sm">Badges</div>
          </div>
        </motion.div>

        {/* Subject Tabs */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {availableSubjects.map((subject, index) => (
            <motion.button
              key={subject}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                selectedSubject === subject
                  ? "bg-white/20 text-white border-2 border-white/40"
                  : "bg-white/10 text-white/70 border-2 border-transparent hover:bg-white/15 hover:text-white"
              }`}
              onClick={() => setSelectedSubject(subject)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              data-testid={`tab-${subject}`}
            >
              <span className="text-lg mr-2">{getSubjectIcon(subject)}</span>
              {subject.charAt(0).toUpperCase() + subject.slice(1).replace("-", " ")}
            </motion.button>
          ))}
        </motion.div>

        {/* Skill Tree Container */}
        <motion.div
          className="floating-ui rounded-3xl p-8 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          data-testid="skill-tree-container"
        >
          <SkillTree
            topics={currentTopics}
            progress={processedProgress}
            subject={selectedSubject}
            onTopicClick={handleTopicClick}
          />
        </motion.div>

        {/* Topic Detail Modal */}
        <AnimatePresence>
          {selectedTopic && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeTopicModal}
              data-testid="topic-modal-overlay"
            >
              <motion.div
                className="floating-ui rounded-3xl p-8 max-w-lg w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                data-testid="topic-modal"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-2xl font-bold text-white" data-testid="modal-topic-name">
                    {selectedTopic.name}
                  </h3>
                  <button
                    onClick={closeTopicModal}
                    className="text-white/70 hover:text-white transition-colors duration-300"
                    data-testid="button-close-modal"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-white/80 leading-relaxed" data-testid="modal-description">
                    {selectedTopic.description}
                  </p>

                  <div className="bg-white/10 rounded-2xl p-4">
                    <h4 className="font-semibold text-white mb-3">Skills to Master:</h4>
                    <ul className="space-y-2">
                      {selectedTopic.skills.map((skill, index) => (
                        <li key={index} className="flex items-center text-white/80 text-sm">
                          <i className="fas fa-star text-accent-teal mr-2 text-xs"></i>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {processedProgress[selectedTopic.id] && (
                    <div className="bg-white/10 rounded-2xl p-4">
                      <h4 className="font-semibold text-white mb-3">Your Progress:</h4>
                      <div className="space-y-2 text-sm text-white/80">
                        <div>Questions Answered: {processedProgress[selectedTopic.id].questionsAnswered}</div>
                        <div>Correct Answers: {processedProgress[selectedTopic.id].correctAnswers}</div>
                        <div>Accuracy: {
                          processedProgress[selectedTopic.id].questionsAnswered > 0 
                            ? Math.round((processedProgress[selectedTopic.id].correctAnswers / processedProgress[selectedTopic.id].questionsAnswered) * 100)
                            : 0
                        }%</div>
                      </div>
                    </div>
                  )}

                  <Link href={`/learning/${selectedTopic.id}`}>
                    <motion.button
                      className="w-full btn-primary py-3 rounded-xl bg-accent-teal hover:bg-accent-teal/80 text-white font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={closeTopicModal}
                      data-testid="button-start-learning"
                    >
                      <i className="fas fa-play mr-2"></i>
                      Start Learning
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </>
  );
}