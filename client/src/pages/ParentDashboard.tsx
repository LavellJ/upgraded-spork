import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Users, Settings, Activity, LogOut, Plus, TrendingUp, Award, BarChart3 } from "lucide-react";
import type { Student, Progress as StudentProgress, ParentControls } from "@shared/schema";

interface ParentInfo {
  id: string;
  name: string;
  email: string;
}

export default function ParentDashboard() {
  const [, setLocation] = useLocation();
  const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const stored = localStorage.getItem("parentInfo");
    if (stored) {
      setParentInfo(JSON.parse(stored));
    } else {
      // Redirect to login if no session
      setLocation("/parent/auth");
    }
  }, [setLocation]);

  // Get authorization header
  const getAuthHeader = () => {
    const token = localStorage.getItem("parentSessionToken");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  // Check if in demo mode
  const isDemoMode = localStorage.getItem("parentDemoMode") === "true";
  
  // Sample demo data
  const demoChildren = [
    {
      id: "demo-child-1",
      name: "Emma",
      ageGroup: "primary",
      currentLevel: 3,
      totalPoints: 450,
      isActive: true,
      parentId: "demo-parent",
      createdAt: new Date()
    },
    {
      id: "demo-child-2", 
      name: "Lucas",
      ageGroup: "upper-primary",
      currentLevel: 5,
      totalPoints: 780,
      isActive: true,
      parentId: "demo-parent",
      createdAt: new Date()
    }
  ];

  // Fetch parent's children (or use demo data)
  const { data: children = [], isLoading: childrenLoading } = useQuery<Student[]>({
    queryKey: ["/api/parents/children"],
    queryFn: async (): Promise<Student[]> => {
      if (isDemoMode) {
        return Promise.resolve(demoChildren);
      }
      const response = await fetch("/api/parents/children", { headers: getAuthHeader() });
      if (!response.ok) throw new Error('Failed to fetch children');
      return response.json();
    },
    enabled: !!parentInfo,
  });

  // Demo progress data
  const demoProgressData: Record<string, StudentProgress[]> = {
    "demo-child-1": [
      { 
        id: "p1", studentId: "demo-child-1", topicId: "addition", completionPercentage: 85, 
        questionsAnswered: 20, correctAnswers: 17, currentStreak: 3, bestStreak: 5,
        lastStudied: new Date(), createdAt: new Date()
      },
      { 
        id: "p2", studentId: "demo-child-1", topicId: "subtraction", completionPercentage: 72, 
        questionsAnswered: 15, correctAnswers: 11, currentStreak: 2, bestStreak: 4,
        lastStudied: new Date(), createdAt: new Date()
      },
      { 
        id: "p3", studentId: "demo-child-1", topicId: "reading", completionPercentage: 90, 
        questionsAnswered: 25, correctAnswers: 23, currentStreak: 4, bestStreak: 6,
        lastStudied: new Date(), createdAt: new Date()
      }
    ],
    "demo-child-2": [
      { 
        id: "p4", studentId: "demo-child-2", topicId: "multiplication", completionPercentage: 95, 
        questionsAnswered: 30, correctAnswers: 29, currentStreak: 8, bestStreak: 10,
        lastStudied: new Date(), createdAt: new Date()
      },
      { 
        id: "p5", studentId: "demo-child-2", topicId: "fractions", completionPercentage: 78, 
        questionsAnswered: 18, correctAnswers: 14, currentStreak: 3, bestStreak: 5,
        lastStudied: new Date(), createdAt: new Date()
      },
      { 
        id: "p6", studentId: "demo-child-2", topicId: "science", completionPercentage: 88, 
        questionsAnswered: 22, correctAnswers: 19, currentStreak: 5, bestStreak: 7,
        lastStudied: new Date(), createdAt: new Date()
      }
    ]
  };

  // Get progress data for children
  const getChildProgress = (childId: string): StudentProgress[] => {
    if (isDemoMode) {
      return demoProgressData[childId] || [];
    }
    return []; // In real mode, we'd fetch from API
  };

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (isDemoMode) {
        return Promise.resolve();
      }
      const response = await fetch("/api/parents/logout", {
        method: "POST",
        headers: getAuthHeader(),
      });
      if (!response.ok) throw new Error('Logout failed');
    },
    onSuccess: () => {
      localStorage.removeItem("parentSessionToken");
      localStorage.removeItem("parentInfo");
      localStorage.removeItem("parentDemoMode");
      toast({
        title: isDemoMode ? "Demo session ended" : "Logged out successfully",
        description: isDemoMode ? "Thanks for exploring!" : "See you next time!",
      });
      setLocation("/parent/auth");
    },
  });

  const calculateChildProgress = (childId: string) => {
    const progress = getChildProgress(childId);
    
    if (!progress || !Array.isArray(progress) || progress.length === 0) {
      return { totalProgress: 0, topicsCompleted: 0, totalTopics: 0 };
    }
    
    const totalTopics = progress.length;
    const completedTopics = progress.filter((p: any) => (p.completionPercentage || 0) >= 80).length;
    const averageProgress = totalTopics > 0 
      ? Math.round(progress.reduce((sum: number, p: any) => sum + (p.completionPercentage || 0), 0) / totalTopics)
      : 0;

    return {
      totalProgress: averageProgress,
      topicsCompleted: completedTopics,
      totalTopics
    };
  };

  if (!parentInfo) {
    return (
      <>
        <AtmosphericBackground />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-center">
            <p>Redirecting to login...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AtmosphericBackground />
      
      <div className="min-h-screen p-4 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {parentInfo.name}
              {isDemoMode && <span className="text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded ml-3">DEMO MODE</span>}
            </h1>
            <p className="text-white/70">
              {isDemoMode ? "Exploring the parent dashboard with sample data" : "Monitor and guide your child's learning journey"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setLocation("/dashboard")}
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              data-testid="button-child-view"
            >
              Child View
            </Button>
            <Button
              onClick={() => logoutMutation.mutate()}
              variant="outline" 
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-sm border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
              <Users className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white/20">
              <Activity className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-white data-[state=active]:bg-white/20">
              <Settings className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-white data-[state=active]:bg-white/20">
              <Activity className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6">
              {childrenLoading ? (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6">
                    <p className="text-white text-center">Loading children...</p>
                  </CardContent>
                </Card>
              ) : !children || children.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6 text-center">
                    <Users className="w-12 h-12 text-white/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No children added yet</h3>
                    <p className="text-white/70 mb-4">Add your first child to start monitoring their learning progress.</p>
                    <Button 
                      onClick={() => setLocation("/parent/add-child")}
                      className="bg-gradient-to-r from-sunset-orange to-warm-orange"
                      data-testid="button-add-first-child"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Child
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Your Children</h2>
                    <Button 
                      onClick={() => setLocation("/parent/add-child")}
                      className="bg-gradient-to-r from-sunset-orange to-warm-orange"
                      data-testid="button-add-child"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Child
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {(children || []).map((child: any) => {
                      const progressData = calculateChildProgress(child.id);
                      return (
                        <Card 
                          key={child.id} 
                          className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                          onClick={() => setLocation(`/parent/child/${child.id}`)}
                          data-testid={`card-child-${child.id}`}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-white">{child.name}</CardTitle>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="secondary" className="bg-white/20 text-white">
                                    {child.ageGroup.replace('-', ' ')}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-white/20 text-white">
                                    Level {child.currentLevel}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-white/20 text-white">
                                    {child.totalPoints} pts
                                  </Badge>
                                </div>
                              </div>
                              {!child.isActive && (
                                <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between text-sm text-white/80 mb-1">
                                  <span>Overall Progress</span>
                                  <span>{progressData.totalProgress}%</span>
                                </div>
                                <Progress value={progressData.totalProgress} className="h-2" />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-white/70">Topics Completed</p>
                                  <p className="text-white font-semibold">
                                    {progressData.topicsCompleted} / {progressData.totalTopics}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-white/70">Last Active</p>
                                  <p className="text-white font-semibold">Today</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Learning Time Patterns */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Learning Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-white/70 text-sm mb-2">Peak Learning Hours</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-blue-500 rounded flex-1"></div>
                          <span className="text-white text-xs">3-5 PM</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-white/70 text-sm mb-2">Average Session Length</p>
                        <p className="text-white text-lg font-semibold">18 minutes</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-sm mb-2">Weekly Consistency</p>
                        <div className="grid grid-cols-7 gap-1">
                          {['M','T','W','T','F','S','S'].map((day, i) => (
                            <div key={day} className="text-center">
                              <div className={`h-8 w-8 rounded ${i < 5 ? 'bg-green-500' : 'bg-gray-500'} mb-1`}></div>
                              <span className="text-xs text-white/70">{day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Mastery */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Subject Mastery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { subject: 'Mathematics', progress: 85, trend: 'up' },
                        { subject: 'Reading', progress: 92, trend: 'up' },
                        { subject: 'Science', progress: 78, trend: 'stable' },
                        { subject: 'Writing', progress: 70, trend: 'up' }
                      ].map((item) => (
                        <div key={item.subject}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white">{item.subject}</span>
                            <span className="text-white/70">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Learning Insights */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Learning Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-500/20 p-4 rounded-lg">
                      <h4 className="text-green-300 font-semibold mb-2">Strengths</h4>
                      <ul className="text-white/80 text-sm space-y-1">
                        <li>• Problem solving</li>
                        <li>• Pattern recognition</li>
                        <li>• Reading comprehension</li>
                      </ul>
                    </div>
                    <div className="bg-yellow-500/20 p-4 rounded-lg">
                      <h4 className="text-yellow-300 font-semibold mb-2">Focus Areas</h4>
                      <ul className="text-white/80 text-sm space-y-1">
                        <li>• Fraction concepts</li>
                        <li>• Spelling accuracy</li>
                        <li>• Time management</li>
                      </ul>
                    </div>
                    <div className="bg-blue-500/20 p-4 rounded-lg">
                      <h4 className="text-blue-300 font-semibold mb-2">Learning Style</h4>
                      <ul className="text-white/80 text-sm space-y-1">
                        <li>• Visual learner</li>
                        <li>• Prefers step-by-step</li>
                        <li>• Benefits from examples</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="grid gap-6">
              {/* Recent Achievements */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { badge: '🏆', title: 'Math Master', date: '2 days ago', description: 'Completed 50 math problems' },
                      { badge: '📚', title: 'Bookworm', date: '1 week ago', description: 'Read 5 stories in a row' },
                      { badge: '🔥', title: 'Streak Champion', date: '1 week ago', description: '7-day learning streak' },
                      { badge: '🎯', title: 'Perfect Score', date: '2 weeks ago', description: '100% on science quiz' }
                    ].map((achievement, i) => (
                      <div key={i} className="bg-white/5 p-4 rounded-lg">
                        <div className="text-2xl mb-2">{achievement.badge}</div>
                        <h4 className="text-white font-semibold">{achievement.title}</h4>
                        <p className="text-white/60 text-xs mb-2">{achievement.date}</p>
                        <p className="text-white/80 text-sm">{achievement.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Milestones */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Learning Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { level: 'Level 5', date: 'Current', description: 'Advanced problem solving', current: true },
                      { level: 'Level 4', date: '2 weeks ago', description: 'Multiplication mastery', current: false },
                      { level: 'Level 3', date: '1 month ago', description: 'Reading fluency achieved', current: false },
                      { level: 'Level 2', date: '2 months ago', description: 'Basic arithmetic completion', current: false }
                    ].map((milestone, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full ${milestone.current ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-white font-semibold">{milestone.level}</span>
                            <span className="text-white/60 text-sm">{milestone.date}</span>
                          </div>
                          <p className="text-white/80 text-sm">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid gap-6">
              {/* Weekly Summary */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">This Week's Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">2h 15m</p>
                      <p className="text-white/70 text-sm">Total Learning Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">127</p>
                      <p className="text-white/70 text-sm">Questions Answered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">89%</p>
                      <p className="text-white/70 text-sm">Average Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">5</p>
                      <p className="text-white/70 text-sm">Days Active</p>
                    </div>
                  </div>
                  
                  <div className="bg-green-500/20 p-4 rounded-lg">
                    <h4 className="text-green-300 font-semibold mb-2">🌟 This Week's Highlight</h4>
                    <p className="text-white/80">Emma showed exceptional improvement in fractions, increasing accuracy from 65% to 85% through persistent practice and using visual aids.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Trends */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Attention Span Development</h4>
                      <p className="text-white/80 text-sm mb-2">Average focus time has increased from 12 to 18 minutes over the past month</p>
                      <div className="h-2 bg-gray-700 rounded">
                        <div className="h-2 bg-blue-500 rounded" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">Problem-Solving Speed</h4>
                      <p className="text-white/80 text-sm mb-2">Time per question decreased by 23% while maintaining accuracy</p>
                      <div className="h-2 bg-gray-700 rounded">
                        <div className="h-2 bg-green-500 rounded" style={{width: '77%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">Independence Level</h4>
                      <p className="text-white/80 text-sm mb-2">Requesting hints 40% less often, showing increased confidence</p>
                      <div className="h-2 bg-gray-700 rounded">
                        <div className="h-2 bg-purple-500 rounded" style={{width: '82%'}}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}