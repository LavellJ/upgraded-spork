import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { QuestIsland as QuestIslandMap } from "@/components/QuestIsland/QuestIsland";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { getLearnerName } from "@/utils/learnerName";

export default function QuestIslandPage() {
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLesson(lessonId);
    console.log("Selected lesson:", lessonId);
    // Navigate to lesson or show lesson modal
  };

  return (
    <div className="relative min-h-screen">
      <FloatingNavigation />

      {/* Quest Island Map */}
      <QuestIslandMap onLessonSelect={handleLessonSelect} />

      {/* Welcome Message */}
      <motion.div
        className="fixed bottom-8 left-8 bg-gradient-to-br from-blue-500/90 to-purple-600/90 backdrop-blur-sm text-white px-6 py-4 rounded-2xl shadow-lg max-w-sm"
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 2, duration: 0.8, ease: "easeOut" }}
        data-testid="welcome-message"
      >
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/90 shadow-lg border border-white/30">
            <img 
              src="/attached_assets/image_1756014874313.png"
              alt="Scout Explorer"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-semibold">Scout</span>
        </div>
        <p className="text-sm leading-relaxed">
          G'day, {getLearnerName()}! Welcome to Quest Island! Click on the glowing biomes to start your learning adventure. 
          Complete lessons to unlock new areas and collect amazing treasures!
        </p>
      </motion.div>
    </div>
  );
}