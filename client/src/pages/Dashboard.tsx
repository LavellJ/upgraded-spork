import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { ProgressLandscape } from "@/components/ProgressLandscape";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { GeometricIcon } from "@/components/GeometricIcon";
import type { Topic, Progress } from "@shared/schema";
import type { AgeGroup } from "@/components/AgeSelector";

export default function Dashboard() {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");

  useEffect(() => {
    // Get age group from localStorage
    const storedAgeGroup = localStorage.getItem("selectedAgeGroup");
    if (storedAgeGroup) {
      setSelectedAgeGroup(storedAgeGroup);
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
                {" "}Learner
              </span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto" data-testid="text-welcome-description">
              Continue your learning journey with personalized lessons and beautiful Pomodoro sessions.
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            
            {/* Pomodoro Timer */}
            <div className="col-span-full lg:col-span-1" data-testid="pomodoro-section">
              <PomodoroTimer topicName="Mathematics Session" />
            </div>
            
            {/* Topic Selection */}
            <div className="col-span-full lg:col-span-2" data-testid="topic-selection">
              <div className="floating-ui rounded-3xl p-8">
                <h3 className="font-display text-xl font-semibold text-white mb-6">
                  Available Topics
                </h3>
                
                {topicsLoading ? (
                  <div className="space-y-6">
                    {["Math", "Literacy", "Science"].map((subject) => (
                      <div key={subject}>
                        <div className="h-6 bg-white/20 rounded w-24 mb-4"></div>
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div key={i} className="bg-white/10 rounded-xl p-4 animate-pulse">
                              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-white/20 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {[
                      { key: "mathematics", label: "Math" },
                      { key: "literacy", label: "Literacy" },
                      { key: "science", label: "Science" }
                    ].map(({ key, label }) => {
                      const subjectTopics = topics.filter(topic => topic.subject === key);
                      if (subjectTopics.length === 0) return null;
                      
                      return (
                        <div key={key}>
                          <div className="flex items-center mb-4">
                            <div className="mr-3">
                              <GeometricIcon 
                                type="subject" 
                                variant={key}
                                size="lg"
                                animated={true}
                              />
                            </div>
                            <h4 className="font-display text-lg font-semibold text-white">
                              {label}
                            </h4>
                            <div className="ml-3 bg-warm-orange/20 text-warm-orange px-2 py-1 rounded-full text-xs font-medium">
                              {subjectTopics.length} topics
                            </div>
                          </div>
                          <div className="grid gap-3">
                            {subjectTopics.map((topic) => (
                              <Link key={topic.id} href={`/learning?topic=${topic.id}`}>
                                <div className="bg-white/15 hover:bg-white/25 rounded-xl p-5 cursor-pointer transition-all duration-300 group border border-white/10 hover:border-warm-orange/30" data-testid={`card-topic-${topic.id}`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="font-semibold text-white group-hover:text-warm-orange transition-colors" data-testid={`text-topic-name-${topic.id}`}>
                                        {topic.name}
                                      </h5>
                                      <p className="text-white/60 text-sm mt-1" data-testid={`text-topic-level-${topic.id}`}>
                                        Level {topic.level}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {topic.isUnlocked === "true" ? (
                                        <>
                                          <i className="fas fa-unlock text-success-green"></i>
                                          <i className="fas fa-arrow-right text-white/60 group-hover:text-warm-orange transition-colors"></i>
                                        </>
                                      ) : (
                                        <i className="fas fa-lock text-white/40"></i>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Badge Display */}
            <div className="col-span-full" data-testid="badge-section">
              <div className="floating-ui rounded-3xl p-8">
                <BadgeDisplay 
                  studentId="demo-student" 
                  ageGroup={selectedAgeGroup} 
                  compact={true}
                />
              </div>
            </div>
          </div>
          
          {/* Full Badge Collection */}
          <div className="mb-16" data-testid="badge-collection">
            <div className="floating-ui rounded-3xl p-8">
              <BadgeDisplay 
                studentId="demo-student" 
                ageGroup={selectedAgeGroup} 
              />
            </div>
          </div>

          {/* Progress Landscape */}
          <div data-testid="progress-section">
            {progressLoading ? (
              <div className="floating-ui rounded-3xl p-8">
                <div className="animate-pulse">
                  <div className="h-6 bg-white/20 rounded w-1/4 mb-8"></div>
                  <div className="h-32 bg-white/10 rounded-2xl mb-8"></div>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="text-center">
                        <div className="h-1 bg-white/20 rounded mb-2"></div>
                        <div className="h-4 bg-white/20 rounded w-3/4 mx-auto mb-1"></div>
                        <div className="h-3 bg-white/20 rounded w-1/2 mx-auto"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <ProgressLandscape progress={progress} topics={topics} />
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-16 text-center" data-testid="quick-actions">
            <h3 className="font-display text-2xl font-semibold text-white mb-8">
              Quick Actions
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/learning">
                <button className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300" data-testid="button-start-learning">
                  Start Learning
                  <i className="fas fa-play ml-2"></i>
                </button>
              </Link>
              <button className="bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors duration-300" data-testid="button-practice-mode">
                Practice Mode
                <i className="fas fa-dumbbell ml-2"></i>
              </button>
              <Link href="/progress">
                <button className="bg-gradient-to-r from-accent-teal to-sky-blue text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300" data-testid="button-review-progress">
                  Progress Journey
                  <i className="fas fa-route ml-2"></i>
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
