import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestIsland as QuestIslandMap } from "@/components/QuestIsland/QuestIsland";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { getLearnerName } from "@/utils/learnerName";

export default function QuestIslandPage() {
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLesson(lessonId);
    // Selected lesson: lessonId
    // Navigate to lesson or show lesson modal
  };

  const handleOpenWorkbook = () => {
    setLocation('/journey-journal');
  };

  return (
    <div className="relative min-h-screen">
      <FloatingNavigation />

      {/* Quest Island Map */}
      <QuestIslandMap onLessonSelect={handleLessonSelect} />

      {/* Scout's Workbook Button */}
      <motion.div
        className="fixed top-8 right-8 z-50"
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
      >
        <Button
          onClick={handleOpenWorkbook}
          className="group relative w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl border-4 border-amber-300 hover:border-amber-200"
          style={{
            boxShadow: `
              0 10px 25px rgba(245, 158, 11, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(217, 119, 6, 0.3)
            `,
          }}
          data-testid="button-open-workbook"
        >
          {/* Scout's Backpack Icon */}
          <span className="text-3xl group-hover:scale-110 transition-transform duration-200">
            🎒
          </span>
          
          {/* Floating tooltip */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-amber-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap font-medium shadow-lg">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-900 rotate-45"></div>
            Scout's Journey Journal
          </div>
          
          {/* Pulsing glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 opacity-50 animate-pulse blur-sm -z-10 group-hover:opacity-70 transition-opacity duration-300"></div>
        </Button>
      </motion.div>

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