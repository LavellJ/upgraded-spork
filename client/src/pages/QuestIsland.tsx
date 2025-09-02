import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestIsland as QuestIslandMap } from "@/components/QuestIsland/QuestIsland";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
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
    <>
      <AtmosphericBackground />
      <div className="relative min-h-screen">
        <FloatingNavigation />

        {/* Campfire Learning Trail Map */}
        <QuestIslandMap onLessonSelect={handleLessonSelect} />

        {/* Scout's Workbook Button */}
        <motion.div
          className="fixed top-8 right-8 z-50"
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
        >
          <button
            onClick={handleOpenWorkbook}
            className="group relative cursor-pointer transform transition-all duration-300 hover:scale-110"
            data-testid="button-open-workbook"
          >
            {/* Scout's Journal - Closed by default, Open on hover */}
            <div className="relative w-72 h-72">
              {/* Closed Journal (default state) */}
              <img 
                src="/attached_assets/6914ebbd-adcf-4dd8-bdc4-bd1ef3daaa23_1756264852126.png"
                alt="Scout's Closed Journal" 
                className="absolute inset-0 w-full h-full object-contain opacity-100 group-hover:opacity-0 transition-opacity duration-300"
              />
              {/* Open Journal (hover state) */}
              <img 
                src="/attached_assets/66288809-4cbc-4a05-bdf5-1e2308c1401d_1756264857142.png"
                alt="Scout's Open Journal"
                className="absolute inset-0 w-full h-full object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </div>
            
          </button>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          className="fixed bottom-8 left-8 bg-gradient-to-br from-brand-primary/90 to-brand-accent/90 backdrop-blur-sm text-fg-base px-6 py-4 rounded-2xl shadow-lg max-w-sm"
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
            G'day, {getLearnerName()}! Welcome to Campfire learning trail! Click on the glowing biomes to start your learning adventure. 
            Complete lessons to unlock new areas and collect amazing treasures!
          </p>
        </motion.div>
      </div>
    </>
  );
}