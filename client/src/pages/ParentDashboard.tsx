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
import { AlertCircle, Users, Settings, Activity, LogOut, Plus } from "lucide-react";
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
    queryFn: () => isDemoMode ? Promise.resolve(demoChildren) : apiRequest("/api/parents/children", { headers: getAuthHeader() }),
    enabled: !!parentInfo,
  });

  // Demo progress data
  const demoProgressData = {
    "demo-child-1": [
      { studentId: "demo-child-1", topicId: "addition", completionPercentage: 85, questionsAnswered: 20, correctAnswers: 17 },
      { studentId: "demo-child-1", topicId: "subtraction", completionPercentage: 72, questionsAnswered: 15, correctAnswers: 11 },
      { studentId: "demo-child-1", topicId: "reading", completionPercentage: 90, questionsAnswered: 25, correctAnswers: 23 }
    ],
    "demo-child-2": [
      { studentId: "demo-child-2", topicId: "multiplication", completionPercentage: 95, questionsAnswered: 30, correctAnswers: 29 },
      { studentId: "demo-child-2", topicId: "fractions", completionPercentage: 78, questionsAnswered: 18, correctAnswers: 14 },
      { studentId: "demo-child-2", topicId: "science", completionPercentage: 88, questionsAnswered: 22, correctAnswers: 19 }
    ]
  };

  // Fetch progress for each child (or use demo data)
  const childProgressQueries = children.map(child => 
    useQuery<StudentProgress[]>({
      queryKey: [`/api/progress/${child.id}`],
      queryFn: () => isDemoMode 
        ? Promise.resolve(demoProgressData[child.id as keyof typeof demoProgressData] || [])
        : apiRequest(`/api/progress/${child.id}`, { headers: getAuthHeader() }),
      enabled: !!child.id,
    })
  );

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => isDemoMode 
      ? Promise.resolve() 
      : apiRequest("/api/parents/logout", {
          method: "POST",
          headers: getAuthHeader(),
        }),
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
    const progressQuery = childProgressQueries.find(q => 
      q.data && q.data.length > 0 && q.data[0].studentId === childId
    );
    
    if (!progressQuery?.data) return { totalProgress: 0, topicsCompleted: 0, totalTopics: 0 };
    
    const progress = progressQuery.data;
    const totalTopics = progress.length;
    const completedTopics = progress.filter(p => p.completionPercentage >= 80).length;
    const averageProgress = totalTopics > 0 
      ? Math.round(progress.reduce((sum, p) => sum + p.completionPercentage, 0) / totalTopics)
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
            <TabsTrigger value="controls" className="text-white data-[state=active]:bg-white/20">
              <Settings className="w-4 h-4 mr-2" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-white data-[state=active]:bg-white/20">
              <Activity className="w-4 h-4 mr-2" />
              Activity
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
              ) : children.length === 0 ? (
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
                    {children.map((child) => {
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

          <TabsContent value="controls">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Parental Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Select a child from the overview to manage their settings.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">Recent parent activities will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}