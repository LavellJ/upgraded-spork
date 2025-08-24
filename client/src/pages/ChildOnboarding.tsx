import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import { ExplorerBuddy } from "@/components/ExplorerBuddy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Star, Heart, Zap } from "lucide-react";
import type { AgeGroup } from "@/components/AgeSelector";

interface OnboardingStep {
  id: string;
  title: string;
  component: React.ReactNode;
}

export default function ChildOnboarding() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [childName, setChildName] = useState("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | "">("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  // Create child profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("POST", "/api/students", profileData);
      return response.json();
    },
    onSuccess: (data) => {
      // Store child info in localStorage for this demo
      localStorage.setItem("childProfile", JSON.stringify({
        id: data.id,
        name: childName,
        ageGroup: selectedAgeGroup,
        interests: selectedInterests,
        learningStyle
      }));
      localStorage.setItem("selectedAgeGroup", selectedAgeGroup);
      
      toast({
        title: "Welcome to LearnOz! 🎉",
        description: `${childName}'s learning adventure is ready to begin!`,
      });
      
      setIsComplete(true);
      setTimeout(() => setLocation("/dashboard"), 3000);
    },
  });

  const ageGroups: Array<{id: AgeGroup; label: string; description: string; emoji: string}> = [
    { 
      id: "pre-primary", 
      label: "Little Explorer", 
      description: "Ages 4-6 • Fun with letters, numbers & colors",
      emoji: "🌱"
    },
    { 
      id: "primary", 
      label: "Young Adventurer", 
      description: "Ages 6-9 • Reading, math & discovering the world",
      emoji: "🌟"
    },
    { 
      id: "upper-primary", 
      label: "Brave Scholar", 
      description: "Ages 9-12 • Advanced thinking & problem solving",
      emoji: "🚀"
    }
  ];

  const interests = [
    { id: "animals", label: "Animals", emoji: "🐾" },
    { id: "space", label: "Space", emoji: "🌟" },
    { id: "nature", label: "Nature", emoji: "🌿" },
    { id: "art", label: "Art", emoji: "🎨" },
    { id: "music", label: "Music", emoji: "🎵" },
    { id: "sports", label: "Sports", emoji: "⚽" },
    { id: "books", label: "Books", emoji: "📚" },
    { id: "science", label: "Science", emoji: "🔬" }
  ];

  const learningStyles = [
    { 
      id: "visual", 
      label: "I love pictures and colors", 
      emoji: "🎨",
      description: "Learn best with images, charts, and visual aids"
    },
    { 
      id: "hands-on", 
      label: "I like to touch and build things", 
      emoji: "🔧",
      description: "Learn best by doing activities and experiments"
    },
    { 
      id: "listening", 
      label: "I enjoy stories and music", 
      emoji: "🎵",
      description: "Learn best through sounds, songs, and discussions"
    }
  ];

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome step
      case 1: return childName.trim().length > 0;
      case 2: return selectedAgeGroup !== "";
      case 3: return selectedInterests.length > 0;
      case 4: return learningStyle !== "";
      default: return false;
    }
  };

  const handleComplete = () => {
    createProfileMutation.mutate({
      name: childName,
      ageGroup: selectedAgeGroup,
      interests: selectedInterests,
      learningStyle,
      isActive: true
    });
  };

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to LearnOz!",
      component: (
        <div className="text-center space-y-8">
          <div className="relative">
            <div className="text-8xl mb-6 animate-bounce">🌟</div>
            <div className="absolute inset-0 animate-pulse">
              <Sparkles className="w-6 h-6 text-yellow-300 absolute top-2 left-1/3" />
              <Star className="w-4 h-4 text-blue-300 absolute bottom-4 right-1/3" />
              <Heart className="w-5 h-5 text-pink-300 absolute top-8 right-1/4" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="font-display text-4xl font-bold text-white">
              Ready for an Amazing Adventure?
            </h2>
            <p className="text-white/80 text-lg max-w-md mx-auto">
              You're about to meet your learning buddy and start exploring a magical world of knowledge!
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-sm mx-auto">
            <p className="text-white/90 text-sm">
              🎯 Learn at your own pace<br/>
              🏆 Earn cool badges<br/>
              🌟 Discover amazing things<br/>
              🐾 Your buddy will help you!
            </p>
          </div>
        </div>
      )
    },
    {
      id: "name",
      title: "What's Your Name?",
      component: (
        <div className="text-center space-y-8">
          <div className="text-6xl mb-6">👋</div>
          
          <div className="space-y-4">
            <h2 className="font-display text-3xl font-bold text-white">
              Hello there, explorer!
            </h2>
            <p className="text-white/80 text-lg">
              What would you like us to call you?
            </p>
          </div>
          
          <div className="max-w-sm mx-auto">
            <Input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Type your name here..."
              className="text-center text-lg py-4 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              data-testid="input-child-name"
            />
          </div>
          
          {childName && (
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-4 max-w-sm mx-auto animate-fade-in">
              <p className="text-white font-semibold">
                Nice to meet you, {childName}! 🌟
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: "age",
      title: "Choose Your Adventure Level",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="font-display text-3xl font-bold text-white">
              Which adventure is perfect for you?
            </h2>
            <p className="text-white/80">
              Pick the one that sounds most exciting!
            </p>
          </div>
          
          <div className="grid gap-4 max-w-2xl mx-auto">
            {ageGroups.map((group) => (
              <Card
                key={group.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedAgeGroup === group.id
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-400/50'
                    : 'bg-white/10 border-white/20'
                } backdrop-blur-sm`}
                onClick={() => setSelectedAgeGroup(group.id)}
                data-testid={`card-age-${group.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{group.emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{group.label}</h3>
                      <p className="text-white/70 text-sm">{group.description}</p>
                    </div>
                    {selectedAgeGroup === group.id && (
                      <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "interests",
      title: "What Do You Love?",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-6">❤️</div>
            <h2 className="font-display text-3xl font-bold text-white">
              Tell us what makes you excited!
            </h2>
            <p className="text-white/80">
              Pick as many as you like - we'll make learning super fun!
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {interests.map((interest) => (
              <Card
                key={interest.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedInterests.includes(interest.id)
                    ? 'bg-gradient-to-r from-pink-500/30 to-yellow-500/30 border-pink-400/50'
                    : 'bg-white/10 border-white/20'
                } backdrop-blur-sm`}
                onClick={() => toggleInterest(interest.id)}
                data-testid={`card-interest-${interest.id}`}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{interest.emoji}</div>
                  <p className="text-white font-semibold text-sm">{interest.label}</p>
                  {selectedInterests.includes(interest.id) && (
                    <Star className="w-4 h-4 text-yellow-400 mx-auto mt-2 animate-spin" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedInterests.length > 0 && (
            <div className="text-center">
              <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2">
                {selectedInterests.length} awesome choice{selectedInterests.length !== 1 ? 's' : ''}! 🎉
              </Badge>
            </div>
          )}
        </div>
      )
    },
    {
      id: "learning-style",
      title: "How Do You Like to Learn?",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-6">🧠</div>
            <h2 className="font-display text-3xl font-bold text-white">
              Everyone learns differently!
            </h2>
            <p className="text-white/80">
              Which sounds most like you?
            </p>
          </div>
          
          <div className="grid gap-4 max-w-2xl mx-auto">
            {learningStyles.map((style) => (
              <Card
                key={style.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  learningStyle === style.id
                    ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border-purple-400/50'
                    : 'bg-white/10 border-white/20'
                } backdrop-blur-sm`}
                onClick={() => setLearningStyle(style.id)}
                data-testid={`card-style-${style.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{style.emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{style.label}</h3>
                      <p className="text-white/70 text-sm">{style.description}</p>
                    </div>
                    {learningStyle === style.id && (
                      <Heart className="w-6 h-6 text-pink-400 animate-pulse" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }
  ];

  if (isComplete) {
    return (
      <>
        <AtmosphericBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-8">
            <div className="text-8xl mb-6 animate-bounce">🎉</div>
            <h2 className="font-display text-4xl font-bold text-white">
              Welcome to LearnOz, {childName}!
            </h2>
            <p className="text-white/80 text-lg">
              Your adventure is starting...
            </p>
            <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white mx-auto"></div>
          </div>
        </div>
        
        {selectedAgeGroup && (
          <ExplorerBuddy 
            ageGroup={selectedAgeGroup as AgeGroup}
            currentPage="/onboarding"
            isStudying={false}
          />
        )}
      </>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <>
      <AtmosphericBackground />
      
      <div className="relative z-10 min-h-screen pt-12 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-center space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-white w-8'
                      : index < currentStep
                      ? 'bg-green-400'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-white/60 text-sm mt-2">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          
          {/* Step content */}
          <div className="floating-ui rounded-3xl p-8 min-h-[500px] flex flex-col">
            <div className="flex-1">
              {currentStepData.component}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="text-white/60 hover:text-white hover:bg-white/10"
                data-testid="button-back"
              >
                ← Back
              </Button>
              
              <div className="flex-1" />
              
              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed() || createProfileMutation.isPending}
                  className="bg-gradient-to-r from-sunset-orange to-warm-orange hover:scale-105"
                  data-testid="button-start-adventure"
                >
                  {createProfileMutation.isPending ? 'Creating...' : 'Start My Adventure! 🚀'}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-accent-teal to-sky-blue hover:scale-105"
                  data-testid="button-next"
                >
                  Next →
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Show Explorer Buddy from step 2 onwards */}
      {currentStep >= 2 && selectedAgeGroup && (
        <ExplorerBuddy 
          ageGroup={selectedAgeGroup as AgeGroup}
          currentPage="/onboarding"
          isStudying={false}
        />
      )}
    </>
  );
}