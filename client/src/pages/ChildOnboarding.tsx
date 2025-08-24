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
import {
  LittleExplorerIcon,
  YoungAdventurerIcon, 
  BraveScholarIcon,
  AnimalsIcon,
  SpaceIcon,
  NatureIcon,
  ArtIcon,
  MusicIcon,
  SportsIcon,
  BooksIcon,
  ScienceIcon,
  VisualLearningIcon,
  HandsOnLearningIcon,
  AudioLearningIcon,
  SparkleIcon,
  StarIcon,
  HeartIcon
} from "@/components/GeometricIcons";
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
  const [showScoutIntro, setShowScoutIntro] = useState(false);
  const { toast } = useToast();

  // Get the age group from localStorage when component mounts
  useEffect(() => {
    const storedAgeGroup = localStorage.getItem("selectedAgeGroup");
    if (storedAgeGroup) {
      setSelectedAgeGroup(storedAgeGroup as AgeGroup);
    } else {
      // If no age group is selected, redirect back to home
      toast({
        title: "Please select an age group first",
        description: "You need to choose an adventure level before continuing.",
        variant: "destructive"
      });
      setTimeout(() => setLocation("/"), 2000);
    }
  }, [setLocation, toast]);

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
      setTimeout(() => setShowScoutIntro(true), 2000);
    },
  });

  const ageGroups: Array<{id: AgeGroup; label: string; description: string; icon: React.ReactNode}> = [
    { 
      id: "pre-primary", 
      label: "Little Explorer", 
      description: "Ages 4-6 • Fun with letters, numbers & colors",
      icon: <LittleExplorerIcon size={96} className="mx-auto" />
    },
    { 
      id: "primary", 
      label: "Young Adventurer", 
      description: "Ages 6-9 • Reading, math & discovering the world",
      icon: <YoungAdventurerIcon size={96} className="mx-auto" />
    },
    { 
      id: "upper-primary", 
      label: "Brave Scholar", 
      description: "Ages 9-12 • Advanced thinking & problem solving",
      icon: <BraveScholarIcon size={96} className="mx-auto" />
    }
  ];


  const interests = [
    { id: "animals", label: "Animals", icon: <AnimalsIcon size={64} /> },
    { id: "space", label: "Space", icon: <SpaceIcon size={64} /> },
    { id: "nature", label: "Nature", icon: <NatureIcon size={64} /> },
    { id: "art", label: "Art", icon: <ArtIcon size={64} /> },
    { id: "music", label: "Music", icon: <MusicIcon size={64} /> },
    { id: "sports", label: "Sports", icon: <SportsIcon size={64} /> },
    { id: "books", label: "Books", icon: <BooksIcon size={64} /> },
    { id: "science", label: "Science", icon: <ScienceIcon size={64} /> }
  ];

  const learningStyles = [
    { 
      id: "visual", 
      label: "I love pictures and colors", 
      icon: <VisualLearningIcon size={128} />,
      description: "Learn best with images, charts, and visual aids"
    },
    { 
      id: "hands-on", 
      label: "I like to touch and build things", 
      icon: <HandsOnLearningIcon size={128} />,
      description: "Learn best by doing activities and experiments"
    },
    { 
      id: "listening", 
      label: "I enjoy stories and music", 
      icon: <AudioLearningIcon size={128} />,
      description: "Learn best through sounds, songs, and discussions"
    }
  ];


  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome step
      case 1: return childName.trim().length > 0;
      case 2: return selectedInterests.length > 0;
      case 3: return learningStyle !== "";
      default: return false;
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleComplete = () => {
    createProfileMutation.mutate({
      name: childName,
      ageGroup: selectedAgeGroup,
      currentLevel: 1,
      totalPoints: 0,
      parentId: undefined, // For demo purposes, real app would use auth
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
            <div className="mb-6 animate-bounce">
              <SparkleIcon size={96} className="mx-auto" />
            </div>
            <div className="absolute inset-0 animate-pulse">
              <SparkleIcon size={32} className="text-yellow-300 absolute top-2 left-1/3" />
              <StarIcon size={16} className="text-blue-300 absolute bottom-4 right-1/3" />
              <HeartIcon size={28} className="text-pink-300 absolute top-8 right-1/4" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="font-display text-4xl font-bold text-white">
              Ready for an Amazing Adventure?
            </h2>
            <p className="text-white/80 text-lg max-w-md mx-auto">
              You're about to meet Scout, your learning buddy, and start exploring a magical world of knowledge!
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-sm mx-auto">
            <div className="space-y-3 text-white/90 text-sm">
              <div className="flex items-center gap-3">
                <SparkleIcon size={16} className="text-yellow-300" />
                <span>Learn at your own pace</span>
              </div>
              <div className="flex items-center gap-3">
                <StarIcon size={16} className="text-blue-300" />
                <span>Earn cool badges</span>
              </div>
              <div className="flex items-center gap-3">
                <SparkleIcon size={16} className="text-purple-300" />
                <span>Discover amazing things</span>
              </div>
              <div className="flex items-center gap-3">
                <LittleExplorerIcon size={16} className="text-green-300" />
                <span>Scout will help you!</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "name",
      title: "What's Your Name?",
      component: (
        <div className="text-center space-y-8">
          <div className="mb-6">
            <HandsOnLearningIcon size={72} className="mx-auto" />
          </div>
          
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
              <p className="text-white font-semibold flex items-center justify-center gap-2">
                Nice to meet you, {childName}!
                <StarIcon size={20} className="text-yellow-300" />
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: "interests",
      title: "What Do You Love?",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="mb-6">
              <HeartIcon size={72} className="mx-auto text-pink-300" />
            </div>
            <h2 className="font-display text-3xl font-bold text-white">
              What are you curious about?
            </h2>
            <p className="text-white/80">
              Pick the things that make you excited to learn! (Choose as many as you like)
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {interests.map((interest) => (
              <Card
                key={interest.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedInterests.includes(interest.id)
                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border-pink-400/50 ring-2 ring-pink-400/30'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                } backdrop-blur-sm`}
                onClick={() => toggleInterest(interest.id)}
                data-testid={`card-interest-${interest.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="mb-2">{interest.icon}</div>
                    <h3 className="text-white font-semibold text-base">{interest.label}</h3>
                    {selectedInterests.includes(interest.id) && (
                      <Heart className="w-5 h-5 text-pink-400 animate-pulse" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedInterests.length > 0 && (
            <div className="text-center">
              <p className="text-white/70 text-sm">
                Great choices! You've selected {selectedInterests.length} thing{selectedInterests.length !== 1 ? 's' : ''} to explore.
              </p>
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
            <div className="mb-6">
              <VisualLearningIcon size={72} className="mx-auto text-purple-300" />
            </div>
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
                <CardContent className="p-8">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="mb-4">{style.icon}</div>
                    <div>
                      <h3 className="text-white font-bold text-xl">{style.label}</h3>
                      <p className="text-white/70 text-base mt-2">{style.description}</p>
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

  if (isComplete && !showScoutIntro) {
    return (
      <>
        <AtmosphericBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-8">
            <div className="mb-6 animate-bounce">
              <SparkleIcon size={96} className="mx-auto text-yellow-300" />
            </div>
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

  if (showScoutIntro) {
    return (
      <>
        <AtmosphericBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
              <div className="text-4xl mb-4">✨</div>
              <h2 className="font-display text-3xl font-bold text-white mb-2">
                Meet Scout!
              </h2>
              <div className="text-4xl">✨</div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Scout Character */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="animate-bounce">
                    <div className="w-32 h-32 relative">
                      <img
                        src="/attached_assets/image_1756014874313.png"
                        alt="Scout - Your Explorer Buddy"
                        className="w-full h-full object-contain drop-shadow-lg"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 text-4xl animate-pulse">👋</div>
                </div>
              </div>
              
              {/* Scout's Introduction Text */}
              <div className="floating-ui rounded-3xl p-8">
                <div className="space-y-6 text-white">
                  <p className="text-lg font-medium">
                    "Hi, I'm Scout!
                  </p>
                  
                  <p className="text-base leading-relaxed">
                    I love exploring, discovering new things, and sometimes even getting a little lost (that's how the best adventures begin!). Just like you, I'm here to learn, grow, and have fun along the way.
                  </p>
                  
                  <p className="text-base leading-relaxed">
                    We'll be journeying side by side—sometimes I'll cheer you on, sometimes I'll need your help, and whenever you feel stuck, I'll be right here to figure it out with you.
                  </p>
                  
                  <p className="text-base leading-relaxed">
                    Think of me as your adventure buddy. Together, we'll unlock new worlds, face challenges, and celebrate every step forward.
                  </p>
                  
                  <p className="text-lg font-medium text-center mt-8">
                    Are you ready? Let's start our adventure!"
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button
                onClick={() => setLocation("/dashboard")}
                className="bg-gradient-to-r from-sunset-orange to-warm-orange text-white px-8 py-4 rounded-2xl font-display font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-2xl"
                data-testid="button-start-adventure"
              >
                Let's Go, Scout!
              </Button>
            </div>
          </div>
        </div>
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
                  <div className="flex items-center gap-2">
                    {createProfileMutation.isPending ? 'Creating...' : 'Start My Adventure!'}
                    <SpaceIcon size={20} />
                  </div>
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
      {currentStep >= 1 && selectedAgeGroup && (
        <ExplorerBuddy 
          ageGroup={selectedAgeGroup as AgeGroup}
          currentPage="/onboarding"
          isStudying={false}
        />
      )}
    </>
  );
}