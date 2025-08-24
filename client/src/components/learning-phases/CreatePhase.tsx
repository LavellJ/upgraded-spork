import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Camera, Mic, FileText, ArrowRight, Upload, Download } from "lucide-react";
import type { LearningContent } from "@shared/schema";
import type { AgeGroup } from "../AgeSelector";

interface CreatePhaseProps {
  content: LearningContent;
  ageGroup: AgeGroup;
  sessionData: any;
  onPhaseComplete: (results: any) => void;
  previousData?: any;
}

interface CreateContent {
  title?: string;
  content?: string;
  // Legacy support for old structure
  projectMissions?: Array<{
    id: string;
    title: string;
    description: string;
    type: "design" | "explain" | "story" | "experiment" | "problem-solve";
    deliverables: Array<{
      type: "drawing" | "photo" | "video" | "text" | "voice";
      prompt: string;
      optional?: boolean;
    }>;
    successCriteria: string[];
    scaffolds: string[];
  }>;
  teachBackMode?: {
    enabled: boolean;
    scenario: string;
    rubric: {
      clarity: string;
      accuracy: string;
      creativity: string;
    };
  };
}

type ArtifactType = "drawing" | "photo" | "video" | "text" | "voice";

interface Artifact {
  type: ArtifactType;
  content: any;
  prompt: string;
  timestamp: number;
}

export function CreatePhase({ content, ageGroup, sessionData, onPhaseComplete, previousData }: CreatePhaseProps) {
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentDeliverable, setCurrentDeliverable] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [showTeachBack, setShowTeachBack] = useState(false);
  const [teachBackResponse, setTeachBackResponse] = useState("");

  const createContent = content.content;
  
  // Handle both new Scout format (simple string) and legacy format
  const isScoutFormat = typeof createContent === 'string';
  const scoutMessage = isScoutFormat ? createContent : null;
  const legacyContent = !isScoutFormat ? createContent as CreateContent : null;
  const currentMission = legacyContent?.projectMissions?.find(m => m.id === selectedMission);

  const handleMissionSelect = (missionId: string) => {
    setSelectedMission(missionId);
    setArtifacts([]);
    setCurrentDeliverable(0);
  };

  const handleCreateArtifact = (type: ArtifactType, content: any, prompt: string) => {
    const artifact: Artifact = {
      type,
      content,
      prompt,
      timestamp: Date.now()
    };
    
    setArtifacts(prev => [...prev, artifact]);
    
    // Move to next deliverable
    if (currentMission && currentMission.deliverables && currentDeliverable < currentMission.deliverables.length - 1) {
      setCurrentDeliverable(prev => prev + 1);
    } else {
      // All deliverables completed, check if teach-back is enabled
      if (createContent.teachBackMode.enabled) {
        setShowTeachBack(true);
      }
    }
  };

  const handleTextSubmit = () => {
    if (!currentMission || !textContent.trim()) return;
    
    const deliverable = currentMission.deliverables[currentDeliverable];
    handleCreateArtifact("text", textContent, deliverable.prompt);
    setTextContent("");
  };

  const handleVoiceRecord = () => {
    if (!currentMission) return;
    
    // Simulate voice recording (in real app, would use Web Audio API)
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const deliverable = currentMission.deliverables[currentDeliverable];
      handleCreateArtifact("voice", { duration: 15, transcript: "Voice recording captured" }, deliverable.prompt);
    }, 3000);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentMission) return;
    
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const deliverable = currentMission.deliverables[currentDeliverable];
        handleCreateArtifact("photo", e.target?.result, deliverable.prompt);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeachBackSubmit = () => {
    if (!teachBackResponse.trim()) return;
    
    const teachBackArtifact: Artifact = {
      type: "text",
      content: teachBackResponse,
      prompt: createContent.teachBackMode.scenario,
      timestamp: Date.now()
    };
    
    setArtifacts(prev => [...prev, teachBackArtifact]);
    handlePhaseComplete();
  };

  const handlePhaseComplete = () => {
    const results = {
      selectedMission: selectedMission,
      artifactsCreated: artifacts.length,
      artifacts: artifacts.map(a => ({
        artifactType: a.type,
        content: a.content,
        prompt: a.prompt,
        timestamp: a.timestamp
      })),
      missionCompleted: currentMission && currentMission.deliverables ? artifacts.length >= currentMission.deliverables.filter(d => !d.optional).length : false,
      teachBackCompleted: showTeachBack && teachBackResponse.trim().length > 0,
      creativity: calculateCreativityScore(),
      timeSpent: Date.now() - (previousData?.startTime || Date.now())
    };

    onPhaseComplete(results);
  };

  const calculateCreativityScore = () => {
    // Simple creativity scoring based on variety and content length
    const typeVariety = new Set(artifacts.map(a => a.type)).size;
    const avgContentLength = artifacts.reduce((sum, a) => {
      if (typeof a.content === "string") return sum + a.content.length;
      return sum + 50; // Base score for non-text content
    }, 0) / (artifacts.length || 1);
    
    return Math.min((typeVariety * 20) + (avgContentLength / 10), 100);
  };

  const getAgeAppropriateLanguage = () => {
    switch (ageGroup) {
      case "pre-primary":
        return {
          title: "Make Something Cool!",
          instruction: "Show what you learned by creating something awesome!",
          chooseProject: "Pick a fun project:",
          submitButton: "I'm done creating!"
        };
      case "primary":
        return {
          title: "Create & Share",
          instruction: "Use what you've learned to create something new!",
          chooseProject: "Choose your project:",
          submitButton: "Submit my creation"
        };
      case "upper-primary":
        return {
          title: "Apply Your Learning",
          instruction: "Demonstrate your understanding through creative application",
          chooseProject: "Select your project mission:",
          submitButton: "Complete project"
        };
      default:
        return {
          title: "Create & Share",
          instruction: "Use what you've learned to create something new!",
          chooseProject: "Choose your project:",
          submitButton: "Submit my creation"
        };
    }
  };

  const language = getAgeAppropriateLanguage();

  // For Scout format, show simplified creation experience
  if (isScoutFormat) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="floating-ui rounded-3xl p-8" data-testid="scout-create-phase">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 flex items-center justify-center">
              <div className="text-white text-3xl">🎨</div>
            </div>
            <div className="text-white text-xl font-bold">
              Amazing! Let's celebrate our adventure!
            </div>
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="text-white text-lg leading-relaxed">
                {scoutMessage}
              </div>
            </div>
            <button
              onClick={() => handlePhaseComplete()}
              className="px-6 py-3 bg-gradient-to-r from-orange-400 to-yellow-400 text-white font-medium rounded-2xl hover:scale-105 transition-all"
              data-testid="complete-adventure"
            >
              🌟 Adventure Complete! 🌟
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reward & Progression phase for pre-primary - completing Scout's Teaching Cycle
  if (ageGroup === "pre-primary") {
    const [createStep, setCreateStep] = useState<'share' | 'celebrate' | 'next'>('share');
  const createContent = content.content;
    
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Share Your Adventure */}
        {createStep === 'share' && (
          <div className="floating-ui rounded-3xl p-8" data-testid="share-adventure">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center">
                <div className="text-white text-3xl">🎨</div>
              </div>
              
              <div className="text-white text-xl font-bold">
                Let's capture our adventure!
              </div>
              
              <div className="text-white/80 text-lg">
                Show someone what we discovered together
              </div>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleImageUpload(e);
                    setCreateStep('celebrate');
                  }}
                  className="hidden"
                  id="adventure-photo"
                />
                <label
                  htmlFor="adventure-photo"
                  className="block p-6 bg-gradient-to-b from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 rounded-2xl border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 cursor-pointer"
                  data-testid="capture-adventure"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-warm-orange to-sunset-orange flex items-center justify-center">
                      <div className="text-white text-xl">📷</div>
                    </div>
                    <div className="text-white text-base font-medium">Take a Photo</div>
                    <div className="text-white/60 text-sm mt-1">Of your work or yourself!</div>
                  </div>
                </label>
                
                <div className="text-white/40 text-sm">or</div>
                
                <button
                  onClick={() => {
                    setTextContent('I went on an amazing learning adventure!');
                    setCreateStep('celebrate');
                  }}
                  className="w-full p-6 bg-gradient-to-b from-blue-400/20 to-blue-400/10 hover:from-blue-400/30 hover:to-blue-400/20 rounded-2xl border-2 border-blue-400/30 hover:border-blue-400/50 transition-all hover:scale-105"
                  data-testid="tell-story"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center">
                      <div className="text-white text-xl">💬</div>
                    </div>
                    <div className="text-white text-base font-medium">Tell the Story</div>
                    <div className="text-white/60 text-sm mt-1">Share what you learned</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Celebrate Achievement */}
        {createStep === 'celebrate' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="floating-ui rounded-3xl p-12 text-center"
            data-testid="celebration"
          >
            <div className="space-y-6">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 flex items-center justify-center animate-pulse">
                <div className="text-white text-6xl">🏆</div>
              </div>
              
              <div className="text-white text-3xl font-bold">
                Amazing Explorer!
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-white/90 text-lg leading-relaxed">
                  You completed the whole adventure! You learned, tried, thought about it, and shared it. 
                  <br/><br/>
                  <span className="text-yellow-300 font-medium">That's what great learners do!</span>
                </div>
              </div>
              
              <button
                onClick={() => setCreateStep('next')}
                className="px-8 py-4 bg-gradient-to-r from-green-400 to-blue-400 text-white text-lg font-medium rounded-2xl hover:scale-105 transition-all"
                data-testid="whats-next"
              >
                What's next?
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Future Adventures */}
        {createStep === 'next' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="floating-ui rounded-3xl p-8"
            data-testid="future-adventures"
          >
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-dawn-pink to-warm-orange flex items-center justify-center">
                <div className="text-white text-2xl">🗺️</div>
              </div>
              
              <div className="text-white text-lg font-bold">
                Ready for another adventure?
              </div>
              
              <div className="text-white/80 text-base">
                There are so many more amazing things to explore and discover!
              </div>
              
              <button
                onClick={handlePhaseComplete}
                className="px-8 py-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-lg font-medium rounded-2xl hover:scale-105 transition-all"
                data-testid="new-adventure"
              >
                New Adventure!
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="floating-ui rounded-2xl p-6 text-center" data-testid="create-phase-header">
        <h2 className="font-display text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          {language.title}
        </h2>
        <p className="text-white/80 text-lg">
          {createContent.title}
        </p>
        <p className="text-white/60 mt-2">
          {language.instruction}
        </p>
      </div>

      {!selectedMission ? (
        /* Mission Selection */
        <div className="floating-ui rounded-2xl p-8" data-testid="mission-selection">
          <h3 className="font-display text-xl font-semibold text-white mb-6">
            {language.chooseProject}
          </h3>
          
          <div className="grid gap-4">
            {createContent.projectMissions.map((mission) => (
              <motion.button
                key={mission.id}
                onClick={() => handleMissionSelect(mission.id)}
                className="text-left p-6 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 border border-orange-400/30 rounded-xl hover:from-orange-400/30 hover:to-yellow-400/30 transition-all duration-300 group"
                whileHover={{ scale: 1.02 }}
                data-testid={`mission-${mission.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-lg group-hover:text-yellow-400 transition-colors">
                      {mission.title}
                    </h4>
                    <p className="text-white/70 mt-2">
                      {mission.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {mission.deliverables.map((deliverable, index) => (
                        <span 
                          key={index}
                          className="bg-white/20 text-white/80 px-2 py-1 rounded text-xs"
                        >
                          {deliverable.type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ) : !showTeachBack ? (
        /* Active Mission */
        <div className="space-y-6">
          {/* Mission Progress */}
          <div className="floating-ui rounded-2xl p-6" data-testid="mission-progress">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-xl font-semibold text-white">
                {currentMission?.title}
              </h3>
              <button
                onClick={() => setSelectedMission(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                Change project
              </button>
            </div>
            
            <div className="flex justify-center items-center gap-4">
              <span className="text-white/60">
                Step {currentDeliverable + 1} of {currentMission?.deliverables.length}
              </span>
              <div className="w-48 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${((currentDeliverable + 1) / (currentMission?.deliverables.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Deliverable */}
          {currentMission && currentDeliverable < currentMission.deliverables.length && (
            <div className="floating-ui rounded-2xl p-8" data-testid="current-deliverable">
              <div className="mb-6">
                <h4 className="text-white font-semibold text-lg mb-2">
                  Create: {currentMission.deliverables[currentDeliverable].type}
                </h4>
                <p className="text-white/80">
                  {currentMission.deliverables[currentDeliverable].prompt}
                </p>
              </div>

              <div className="space-y-4">
                {currentMission.deliverables[currentDeliverable].type === "text" && (
                  <div>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Write your response here..."
                      className="w-full h-32 bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-orange-400 focus:outline-none resize-none mb-4"
                      data-testid="text-creation-input"
                    />
                    <button
                      onClick={handleTextSubmit}
                      disabled={!textContent.trim()}
                      className="bg-gradient-to-r from-orange-400 to-yellow-400 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2"
                      data-testid="button-submit-text"
                    >
                      <FileText className="w-5 h-5" />
                      Submit Text
                    </button>
                  </div>
                )}

                {currentMission.deliverables[currentDeliverable].type === "voice" && (
                  <div className="text-center">
                    <button
                      onClick={handleVoiceRecord}
                      disabled={isRecording}
                      className={`${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-orange-400 to-yellow-400'} text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto`}
                      data-testid="button-record-voice"
                    >
                      <Mic className="w-5 h-5" />
                      {isRecording ? "Recording..." : "Record Voice Note"}
                    </button>
                    {isRecording && (
                      <p className="text-white/60 mt-2">
                        Speak clearly and explain your thinking...
                      </p>
                    )}
                  </div>
                )}

                {(currentMission.deliverables[currentDeliverable].type === "photo" || 
                  currentMission.deliverables[currentDeliverable].type === "drawing") && (
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white px-8 py-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto cursor-pointer"
                      data-testid="button-upload-image"
                    >
                      <Camera className="w-5 h-5" />
                      Upload Image
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completed Artifacts */}
          {artifacts.length > 0 && (
            <div className="floating-ui rounded-2xl p-8" data-testid="completed-artifacts">
              <h4 className="text-white font-semibold mb-4">Your Creations</h4>
              <div className="grid gap-4">
                {artifacts.map((artifact, index) => (
                  <div key={index} className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                      {artifact.type === "text" && <FileText className="w-5 h-5 text-white" />}
                      {artifact.type === "voice" && <Mic className="w-5 h-5 text-white" />}
                      {(artifact.type === "photo" || artifact.type === "drawing") && <Camera className="w-5 h-5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium capitalize">{artifact.type} Creation</p>
                      <p className="text-white/60 text-sm">{artifact.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Teach-Back Mode */
        <div className="floating-ui rounded-2xl p-8" data-testid="teach-back-mode">
          <h3 className="font-display text-xl font-semibold text-white mb-4">
            🎓 Teach Scout Mode
          </h3>
          <p className="text-white/80 mb-6">
            {createContent.teachBackMode.scenario}
          </p>
          
          <textarea
            value={teachBackResponse}
            onChange={(e) => setTeachBackResponse(e.target.value)}
            placeholder={ageGroup === "pre-primary" ? 
              "Tell Scout how to do it..." : 
              "Explain the concept to Scout..."
            }
            className="w-full h-32 bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-orange-400 focus:outline-none resize-none mb-6"
            data-testid="teach-back-input"
          />
          
          <div className="flex justify-center">
            <button
              onClick={handleTeachBackSubmit}
              disabled={!teachBackResponse.trim()}
              className="bg-gradient-to-r from-orange-400 to-yellow-400 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2"
              data-testid="button-submit-teach-back"
            >
              {language.submitButton}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}