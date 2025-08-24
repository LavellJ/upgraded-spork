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

  // Create simplified adventure path layout
  const createSkillTreeLayout = (): TopicNode[] => {
    const baseTopics = topics.slice(0, 6); // Reduced for cleaner experience
    
    // Simplified flowing path layout - like a winding adventure trail
    const layouts = {
      "pre-primary": [
        { x: 20, y: 80, category: "foundation", icon: <NatureIcon size={40} /> },
        { x: 45, y: 60, category: "numbers", icon: <ScienceIcon size={40} /> },
        { x: 70, y: 45, category: "letters", icon: <BooksIcon size={40} /> },
        { x: 40, y: 30, category: "shapes", icon: <StarIcon size={40} /> },
        { x: 65, y: 15, category: "colors", icon: <ArtIcon size={40} /> },
        { x: 85, y: 5, category: "sounds", icon: <MusicIcon size={40} /> },
      ],
      "primary": [
        { x: 15, y: 85, category: "foundation", icon: <NatureIcon size={40} /> },
        { x: 35, y: 65, category: "arithmetic", icon: <ScienceIcon size={40} /> },
        { x: 60, y: 50, category: "reading", icon: <BooksIcon size={40} /> },
        { x: 30, y: 35, category: "science", icon: <ScienceIcon size={40} /> },
        { x: 70, y: 20, category: "writing", icon: <BooksIcon size={40} /> },
        { x: 90, y: 10, category: "nature", icon: <NatureIcon size={40} /> },
      ],
      "upper-primary": [
        { x: 10, y: 85, category: "foundation", icon: <NatureIcon size={40} /> },
        { x: 30, y: 70, category: "algebra", icon: <ScienceIcon size={40} /> },
        { x: 55, y: 55, category: "science", icon: <ScienceIcon size={40} /> },
        { x: 80, y: 40, category: "literature", icon: <BooksIcon size={40} /> },
        { x: 45, y: 25, category: "coding", icon: <SpaceIcon size={40} /> },
        { x: 75, y: 10, category: "critical", icon: <StarIcon size={40} /> },
      ]
    };

    const layout = layouts[ageGroup] || layouts.primary;
    
    return baseTopics.map((topic, index) => ({
      id: topic.id,
      name: topic.name,
      description: `Explore ${topic.name}`,
      position: layout[index] || { x: 50, y: 50 },
      prerequisites: index > 0 ? [baseTopics[index - 1].id] : [],
      difficulty: index + 1,
      category: layout[index]?.category || "general",
      icon: layout[index]?.icon || <BooksIcon size={40} />,
      animalGuide: null // Simplified - no animal guides cluttering the view
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
      
      {/* Simplified atmospheric background */}
      
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
            {/* Simplified main node */}
            <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${getNodeColor(status)} border border-white/20 flex items-center justify-center transition-all duration-200 ${
              status !== "locked" ? "hover:scale-105 shadow-lg" : "opacity-50"
            }`}>
              
              {/* Node icon */}
              <div className="text-white">
                {node.icon}
              </div>
              
              {/* Simple completion indicator */}
              {status === "completed" && (
                <CheckCircle className="absolute -top-1 -right-1 w-6 h-6 text-green-400 bg-white rounded-full" />
              )}
              
              {/* Lock for locked nodes */}
              {status === "locked" && (
                <Lock className="absolute inset-0 m-auto w-6 h-6 text-white/60" />
              )}
            </div>
            
            {/* Simplified tooltip */}
            {hoveredNode === node.id && (
              <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-50 min-w-48">
                <h3 className="font-semibold text-gray-800 text-center">{node.name}</h3>
                <p className="text-gray-600 text-xs text-center mt-1">{node.description}</p>
                {status === "in-progress" && completion > 0 && (
                  <div className="mt-2">
                    <Progress value={completion} className="h-1" />
                    <p className="text-xs text-gray-500 text-center mt-1">{Math.round(completion)}% complete</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Simplified legend */}
      <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
        <div className="flex items-center gap-4 text-xs text-white/80">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-400" />
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