import { motion } from "framer-motion";
import { SkillTreeNode } from "./SkillTreeNode";
import type { CurriculumTopic } from "@/lib/curriculum";

interface SkillTreeProps {
  topics: CurriculumTopic[];
  progress: Record<string, {
    questionsAnswered: number;
    correctAnswers: number;
    isCompleted: boolean;
  }>;
  subject: string;
  onTopicClick?: (topic: CurriculumTopic) => void;
}

export function SkillTree({ topics, progress, subject, onTopicClick }: SkillTreeProps) {
  // Filter topics by subject and sort by level
  const subjectTopics = topics
    .filter(topic => topic.subject === subject)
    .sort((a, b) => a.level - b.level);

  // Calculate positions for skill tree layout
  const getNodePosition = (index: number, total: number) => {
    const centerX = 400; // Center of the tree
    const startY = 50;
    const levelHeight = 120;
    const nodeSpacing = 150;

    // Create a more organic tree structure
    if (total <= 4) {
      // Simple vertical layout for small trees
      return {
        x: centerX - 40,
        y: startY + (index * levelHeight)
      };
    }

    // More complex branching layout
    const level = Math.floor(index / 2);
    const isLeft = index % 2 === 0;
    const branchOffset = level * 20 + (isLeft ? -50 : 50);
    
    return {
      x: centerX + branchOffset - 40,
      y: startY + (level * levelHeight)
    };
  };

  // Determine if a topic should be unlocked based on previous topic completion
  const isTopicUnlocked = (topic: CurriculumTopic, index: number) => {
    if (index === 0) return true; // First topic is always unlocked
    
    const prevTopic = subjectTopics[index - 1];
    const prevProgress = progress[prevTopic.id];
    
    // Unlock if previous topic has been attempted or if it's explicitly unlocked
    return prevProgress?.questionsAnswered > 0 || topic.isUnlocked;
  };

  // Generate connecting lines between topics
  const generateConnectionLines = () => {
    const lines = [];
    
    for (let i = 0; i < subjectTopics.length - 1; i++) {
      const currentPos = getNodePosition(i, subjectTopics.length);
      const nextPos = getNodePosition(i + 1, subjectTopics.length);
      
      const startX = currentPos.x + 40; // Center of node
      const startY = currentPos.y + 40;
      const endX = nextPos.x + 40;
      const endY = nextPos.y + 40;
      
      lines.push(
        <motion.line
          key={`line-${i}`}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          strokeDasharray="5,5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: i * 0.1, duration: 0.8 }}
        />
      );
    }
    
    return lines;
  };

  const getSubjectDisplayName = () => {
    switch (subject) {
      case "mathematics": return "Mathematics";
      case "literacy": return "Literacy";
      case "science": return "Science";
      case "social-studies": return "Social Studies";
      default: return subject;
    }
  };

  const getSubjectColor = () => {
    switch (subject) {
      case "mathematics": return "text-accent-teal";
      case "literacy": return "text-warm-orange";
      case "science": return "text-success-green";
      case "social-studies": return "text-soft-purple";
      default: return "text-white";
    }
  };

  const getSubjectGradient = () => {
    switch (subject) {
      case "mathematics": return "from-accent-teal/20 to-sky-blue/20";
      case "literacy": return "from-warm-orange/20 to-sunset-orange/20";
      case "science": return "from-success-green/20 to-emerald-400/20";
      case "social-studies": return "from-soft-purple/20 to-deep-purple/20";
      default: return "from-white/10 to-white/5";
    }
  };

  if (subjectTopics.length === 0) return null;

  return (
    <div className="relative w-full h-full min-h-[600px]">
      {/* Subject header */}
      <motion.div
        className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-10
          bg-gradient-to-r ${getSubjectGradient()} backdrop-blur-sm rounded-full px-6 py-3 border border-white/20`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className={`font-display text-xl font-semibold ${getSubjectColor()}`} data-testid={`subject-header-${subject}`}>
          {getSubjectDisplayName()}
        </h3>
      </motion.div>

      {/* SVG for connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {generateConnectionLines()}
      </svg>

      {/* Skill tree nodes */}
      {subjectTopics.map((topic, index) => {
        const position = getNodePosition(index, subjectTopics.length);
        const isUnlocked = isTopicUnlocked(topic, index);
        const topicProgress = progress[topic.id];

        return (
          <SkillTreeNode
            key={topic.id}
            topic={topic}
            progress={topicProgress}
            position={position}
            isUnlocked={isUnlocked}
            onClick={() => onTopicClick?.(topic)}
            delay={index * 0.1}
          />
        );
      })}

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-32 h-32 rounded-full bg-gradient-to-br ${getSubjectGradient()} opacity-20`}
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
            }}
            animate={{
              x: [0, 20, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}