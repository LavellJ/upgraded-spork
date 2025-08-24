import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { ProgressLandscape } from "@/components/ProgressLandscape";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { GeometricIcon } from "@/components/GeometricIcon";
import { SkillTreeMap } from "@/components/SkillTreeMap";
import { ExplorerBuddy } from "@/components/ExplorerBuddy";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, Grid3X3, Trophy } from "lucide-react";
import type { Topic, Progress } from "@shared/schema";
import type { AgeGroup } from "@/components/AgeSelector";

export default function Dashboard() {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [location] = useLocation();
  const [studyStartTime, setStudyStartTime] = useState<number | null>(null);

  useEffect(() => {
    // Get age group and student info from localStorage
    const storedAgeGroup = localStorage.getItem("selectedAgeGroup");
    if (storedAgeGroup) {
      setSelectedAgeGroup(storedAgeGroup);
    }
    
    const storedChild = localStorage.getItem("childProfile");
    if (storedChild) {
      const childData = JSON.parse(storedChild);
      setStudentName(childData.name || "Learner");
    }
  }, []);

  const { data: topics = [], isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: [`/api/topics?ageGroup=${selectedAgeGroup}`],
    enabled: !!selectedAgeGroup,
  });

  const { data: progress = [], isLoading: progressLoading } = useQuery<Progress[]>({
    queryKey: ["/api/progress/demo-student"],
    enabled: !!selectedAgeGroup,
  });

  if (!selectedAgeGroup) {
    return (
      <>
        <AtmosphericBackground />
        <FloatingNavigation />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-white mb-6">
              Please select an age group first
            </h2>
            <Link href="/">
              <button className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300">
                Go Back to Home
              </button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AtmosphericBackground />
      <FloatingNavigation />
      
      <div className="relative z-10 min-h-screen pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Welcome Section */}
          <div className="text-center mb-16" data-testid="welcome-section">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-6">
              Welcome Back,
              <span className="bg-gradient-to-r from-warm-orange to-sunset-orange bg-clip-text text-transparent">
                {" "}{studentName || "Learner"}
              </span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto" data-testid="text-welcome-description">
              Continue your learning journey with personalized lessons and beautiful Pomodoro sessions.
            </p>
          </div>

          {/* Streamlined Dashboard Content */}
          <div className="space-y-8">
            {/* Adventure Map - Main Focus */}
            <div data-testid="skill-tree-section">
              <div className="floating-ui rounded-3xl p-6">
                <h3 className="font-display text-xl font-semibold text-white mb-4 text-center">
                  Your Learning Journey
                </h3>
                <SkillTreeMap ageGroup={selectedAgeGroup as AgeGroup} studentId="demo-student" />
              </div>
            </div>
            
            {/* Secondary Tools */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div data-testid="pomodoro-section">
                <PomodoroTimer topicName="Learning Session" />
              </div>
              <div data-testid="badge-section">
                <div className="floating-ui rounded-3xl p-6">
                  <BadgeDisplay 
                    studentId="demo-student" 
                    ageGroup={selectedAgeGroup} 
                    compact={true}
                  />
                </div>
              </div>
            </div>
            
            {/* Quick Topic Access */}
            <div className="floating-ui rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-white">
                  Quick Access
                </h3>
                <Link href="/learning" className="text-warm-orange hover:text-sunset-orange text-sm transition-colors">
                  Start Learning →
                </Link>
              </div>
              {!topicsLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {topics.slice(0, 6).map((topic) => (
                    <Link key={topic.id} href={`/learning?topic=${topic.id}`}>
                      <div className="bg-white/15 hover:bg-white/25 rounded-xl p-3 cursor-pointer transition-all duration-200 group border border-white/10 hover:border-warm-orange/30" data-testid={`card-topic-${topic.id}`}>
                        <h5 className="font-medium text-white group-hover:text-warm-orange transition-colors text-sm" data-testid={`text-topic-name-${topic.id}`}>
                          {topic.name}
                        </h5>
                        <p className="text-white/60 text-xs mt-1" data-testid={`text-topic-level-${topic.id}`}>
                          Level {topic.level}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>
      
      {/* Explorer Buddy */}
      {selectedAgeGroup && (
        <ExplorerBuddy 
          ageGroup={selectedAgeGroup as AgeGroup}
          currentPage={location}
          isStudying={false}
          studyDuration={0}
          recentProgress={null}
        />
      )}
    </>
  );
}
                </div>
                
                {/* Topic Selection */}
