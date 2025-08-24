import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Lock, Star, Play, CheckCircle, Trophy, Sparkles } from "lucide-react";
import type { Topic, Progress as StudentProgress } from "@shared/schema";
import type { AgeGroup } from "@/components/AgeSelector";
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
  StarIcon,
  SparkleIcon
} from "@/components/GeometricIcons";

interface SkillTreeMapProps {
  ageGroup: AgeGroup;
  studentId: string;
}

interface TopicNode {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  prerequisites: string[];
  difficulty: number;
  category: string;
  icon: React.ReactNode;
  animalGuide: React.ReactNode;
}

export function SkillTreeMap({ ageGroup, studentId }: SkillTreeMapProps) {
  const [, setLocation] = useLocation();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Fetch topics
  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  // Fetch student progress
  const { data: progress = [] } = useQuery<StudentProgress[]>({
    queryKey: [`/api/progress/${studentId}`],
  });

  // Create skill tree layout based on age group
  const createSkillTreeLayout = (): TopicNode[] => {
    const baseTopics = topics.slice(0, 12); // Limit for visual clarity
    
    // Different layouts for different age groups
    const layouts = {
      "pre-primary": [
        { x: 50, y: 80, category: "foundation", icon: <NatureIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 30, y: 60, category: "numbers", icon: <ScienceIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 70, y: 60, category: "letters", icon: <BooksIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 20, y: 40, category: "shapes", icon: <StarIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 50, y: 40, category: "colors", icon: <ArtIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 80, y: 40, category: "sounds", icon: <MusicIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 35, y: 20, category: "patterns", icon: <SparkleIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 65, y: 20, category: "matching", icon: <ScienceIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
      ],
      "primary": [
        { x: 50, y: 85, category: "foundation", icon: <NatureIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 25, y: 70, category: "arithmetic", icon: <ScienceIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 75, y: 70, category: "reading", icon: <BooksIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
        { x: 15, y: 55, category: "geometry", icon: <ScienceIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 50, y: 55, category: "science", icon: <ScienceIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
        { x: 85, y: 55, category: "writing", icon: <BooksIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 30, y: 40, category: "fractions", icon: <ScienceIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 70, y: 40, category: "stories", icon: <BooksIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 20, y: 25, category: "measurement", icon: <ScienceIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 50, y: 25, category: "nature", icon: <NatureIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 80, y: 25, category: "creative", icon: <ArtIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 50, y: 10, category: "logic", icon: <ScienceIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
      ],
      "upper-primary": [
        { x: 50, y: 85, category: "foundation", icon: <NatureIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
        { x: 20, y: 70, category: "algebra", icon: <ScienceIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 50, y: 70, category: "science", icon: <ScienceIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
        { x: 80, y: 70, category: "literature", icon: <BooksIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 10, y: 55, category: "equations", icon: <ScienceIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 35, y: 55, category: "physics", icon: <ScienceIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 65, y: 55, category: "chemistry", icon: <ScienceIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
        { x: 90, y: 55, category: "essays", icon: <BooksIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
        { x: 25, y: 40, category: "geometry", icon: <ScienceIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 50, y: 40, category: "biology", icon: <ScienceIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 75, y: 40, category: "research", icon: <ScienceIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 15, y: 25, category: "statistics", icon: <ScienceIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 40, y: 25, category: "coding", icon: <SpaceIcon size={36} />, animalGuide: <LittleExplorerIcon size={28} /> },
        { x: 60, y: 25, category: "ecology", icon: <NatureIcon size={36} />, animalGuide: <YoungAdventurerIcon size={28} /> },
        { x: 85, y: 25, category: "debate", icon: <BooksIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
        { x: 50, y: 10, category: "critical", icon: <StarIcon size={36} />, animalGuide: <BraveScholarIcon size={28} /> },
      ]
    };

    const layout = layouts[ageGroup] || layouts.primary;
    
    return baseTopics.map((topic, index) => ({
      id: topic.id,
      name: topic.name,
      description: `Learn about ${topic.name.toLowerCase()}`,
      position: layout[index] || { x: 50, y: 50 },
      prerequisites: index > 0 ? [baseTopics[index - 1].id] : [],
      difficulty: Math.ceil((index + 1) / 2),
      category: layout[index]?.category || "general",
      icon: layout[index]?.icon || <BooksIcon size={36} />,
      animalGuide: layout[index]?.animalGuide || <YoungAdventurerIcon size={28} />
    }));
  };

  const skillNodes = createSkillTreeLayout();

  // Calculate node status
  const getNodeStatus = (nodeId: string) => {
    const nodeProgress = progress.find(p => p.topicId === nodeId);
    const completion = nodeProgress?.completionPercentage || 0;
    
    if (completion >= 80) return "completed";
    if (completion > 0) return "in-progress";
    
    // Check if prerequisites are met
    const node = skillNodes.find(n => n.id === nodeId);
    if (node?.prerequisites.length === 0) return "available";
    
    const prerequisitesMet = node?.prerequisites.every(prereqId => {
      const prereqProgress = progress.find(p => p.topicId === prereqId);
      return (prereqProgress?.completionPercentage || 0) >= 80;
    });
    
    return prerequisitesMet ? "available" : "locked";
  };

  // Get connection paths between nodes
  const getConnections = () => {
    return skillNodes.map(node => 
      node.prerequisites.map(prereqId => {
        const prereqNode = skillNodes.find(n => n.id === prereqId);
        if (!prereqNode) return null;
        
        return {
          from: prereqNode.position,
          to: node.position,
          status: getNodeStatus(node.id)
        };
      }).filter(Boolean)
    ).flat();
  };

  const connections = getConnections();

  const handleNodeClick = (nodeId: string) => {
    const status = getNodeStatus(nodeId);
    if (status === "locked") return;
    
    setLocation(`/learning?topic=${nodeId}`);
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case "completed": return "from-green-400 to-emerald-500";
      case "in-progress": return "from-blue-400 to-cyan-500";
      case "available": return "from-orange-400 to-amber-500";
      case "locked": return "from-gray-400 to-gray-500";
      default: return "from-gray-400 to-gray-500";
    }
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-6 h-6 text-white" />;
      case "in-progress": return <Play className="w-6 h-6 text-white" />;
      case "available": return <Star className="w-6 h-6 text-white" />;
      case "locked": return <Lock className="w-6 h-6 text-white/60" />;
      default: return <Star className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-teal-900/30 backdrop-blur-sm border border-white/20">
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
      
      {/* SVG for connection paths */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
          </linearGradient>
        </defs>
        
        {connections.map((connection, index) => {
          if (!connection) return null;
          
          const fromX = (connection.from.x / 100) * 100 + "%";
          const fromY = (connection.from.y / 100) * 100 + "%";
          const toX = (connection.to.x / 100) * 100 + "%";
          const toY = (connection.to.y / 100) * 100 + "%";
          
          return (
            <line
              key={index}
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke="url(#pathGradient)"
              strokeWidth="2"
              strokeDasharray={connection.status === "locked" ? "5,5" : "none"}
              className="animate-pulse-soft"
            />
          );
        })}
      </svg>
      
      {/* Skill nodes */}
      {skillNodes.map((node) => {
        const status = getNodeStatus(node.id);
        const nodeProgress = progress.find(p => p.topicId === node.id);
        const completion = nodeProgress?.completionPercentage || 0;
        
        return (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${node.position.x}%`,
              top: `${node.position.y}%`
            }}
            onClick={() => handleNodeClick(node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            data-testid={`skill-node-${node.id}`}
          >
            {/* Node glow effect */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getNodeColor(status)} opacity-50 scale-150 blur-lg ${status !== "locked" ? "group-hover:scale-175" : ""} transition-all duration-300`} />
            
            {/* Main node */}
            <div className={`relative w-16 h-16 rounded-full bg-gradient-to-r ${getNodeColor(status)} border-2 border-white/30 flex items-center justify-center transition-all duration-300 ${
              status !== "locked" ? "hover:scale-110 hover:border-white/60" : "opacity-60"
            }`}>
              
              {/* Node icon */}
              <div className="relative z-10">
                {getNodeIcon(status)}
              </div>
              
              {/* Animal guide */}
              <div className="absolute -top-2 -right-2 animate-bounce">
                {node.animalGuide}
              </div>
              
              {/* Sparkle effects for completed nodes */}
              {status === "completed" && (
                <>
                  <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-yellow-300 animate-pulse" />
                  <Sparkles className="absolute -bottom-1 -right-1 w-3 h-3 text-yellow-300 animate-pulse delay-1000" />
                </>
              )}
            </div>
            
            {/* Progress ring for in-progress nodes */}
            {status === "in-progress" && completion > 0 && (
              <div className="absolute inset-0 rounded-full border-4 border-transparent" style={{
                background: `conic-gradient(from 0deg, #60a5fa ${completion * 3.6}deg, transparent ${completion * 3.6}deg)`
              }} />
            )}
            
            {/* Node tooltip */}
            {(hoveredNode === node.id || selectedNode === node.id) && (
              <Card className="absolute top-20 left-1/2 transform -translate-x-1/2 w-64 bg-white/95 backdrop-blur-sm border-white/30 shadow-xl z-50 animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">{node.icon}</div>
                    <h3 className="font-bold text-gray-800">{node.name}</h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{node.description}</p>
                  
                  {status === "in-progress" && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(completion)}%</span>
                      </div>
                      <Progress value={completion} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-gray-100">
                      {node.category}
                    </Badge>
                    
                    {status === "locked" ? (
                      <span className="text-xs text-gray-500">Complete prerequisites</span>
                    ) : (
                      <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {status === "completed" ? "Review" : status === "in-progress" ? "Continue" : "Start"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <h4 className="text-white font-semibold mb-2 text-sm">Learning Path Guide</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
            <span className="text-white/80">Mastered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500" />
            <span className="text-white/80">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-400 to-amber-500" />
            <span className="text-white/80">Ready to Learn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-gray-500" />
            <span className="text-white/80">Locked</span>
          </div>
        </div>
      </div>
      
      {/* Stats panel */}
      <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="text-center">
          <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-white font-bold text-lg">
            {progress.filter(p => (p.completionPercentage || 0) >= 80).length}
          </div>
          <div className="text-white/60 text-xs">Topics Mastered</div>
        </div>
      </div>
    </div>
  );
}