import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Copy, Trash2, Clock, BookOpen, Target, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { 
  createPath, 
  loadPaths, 
  deletePath, 
  encodeToLink, 
  generateShortCode,
  type AssignedPath 
} from './assign';
import { SUBJECTS, STANDARDS } from '../data/meta';
import registryData from '../data/registry.json';
import loop1Data from '../data/loop1.json';
import loop2Data from '../data/loop2.json';

interface LessonOption {
  id: string;
  title: string;
  biome: string;
  loop: number;
  standards?: {
    Generic?: string;
    ACARA?: string;
    NZC?: string;
  };
}

interface AssignmentCreatorProps {
  selectedFramework: string;
  onClose?: () => void;
}

export function AssignmentCreator({ selectedFramework, onClose }: AssignmentCreatorProps) {
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [assignmentName, setAssignmentName] = useState('');
  const [expiryDays, setExpiryDays] = useState<number | undefined>(undefined);
  const [biomeFilter, setBiomeFilter] = useState<string>('all');
  const [standardFilter, setStandardFilter] = useState<string>('all');
  const [generatedPath, setGeneratedPath] = useState<AssignedPath | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  // Get all available lessons from loop data
  const allLessons: LessonOption[] = useMemo(() => {
    const lessons: LessonOption[] = [];
    
    // Process loop 1
    Object.entries(loop1Data).forEach(([biome, biomeLessons]) => {
      biomeLessons.forEach((lesson: any) => {
        const registryEntry = registryData['1']?.[biome]?.[lesson.id];
        lessons.push({
          id: lesson.id,
          title: lesson.title,
          biome,
          loop: 1,
          standards: registryEntry?.standards
        });
      });
    });
    
    // Process loop 2
    Object.entries(loop2Data).forEach(([biome, biomeLessons]) => {
      biomeLessons.forEach((lesson: any) => {
        const registryEntry = registryData['2']?.[biome]?.[lesson.id];
        lessons.push({
          id: lesson.id,
          title: lesson.title,
          biome,
          loop: 2,
          standards: registryEntry?.standards
        });
      });
    });
    
    return lessons;
  }, []);

  // Filter lessons based on selected filters
  const filteredLessons = useMemo(() => {
    let filtered = allLessons;
    
    // Filter by biome
    if (biomeFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.biome === biomeFilter);
    }
    
    // Filter by standard
    if (standardFilter !== 'all' && selectedFramework !== 'Generic') {
      filtered = filtered.filter(lesson => {
        const frameworkStandard = lesson.standards?.[selectedFramework as keyof typeof lesson.standards];
        return frameworkStandard && frameworkStandard.toLowerCase().includes(standardFilter.toLowerCase());
      });
    }
    
    return filtered;
  }, [allLessons, biomeFilter, standardFilter, selectedFramework]);

  const handleLessonToggle = (lessonId: string) => {
    setSelectedLessons(prev => 
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const handleCreateAssignment = () => {
    if (!assignmentName.trim() || selectedLessons.length === 0) return;
    
    const path = createPath(assignmentName.trim(), selectedLessons, expiryDays);
    setGeneratedPath(path);
    
    // Reset form
    setAssignmentName('');
    setSelectedLessons([]);
    setExpiryDays(undefined);
    setShowCreator(false);
  };

  const handleCopyLink = async (path: AssignedPath) => {
    const link = encodeToLink(path);
    try {
      await navigator.clipboard.writeText(link);
      alert('Assignment link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  const activePaths = loadPaths();
  const selectedLessonsData = allLessons.filter(lesson => selectedLessons.includes(lesson.id));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Assign Learning Path
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Create Assignment Button */}
        {!showCreator && (
          <Button 
            onClick={() => setShowCreator(true)}
            className="w-full"
            data-testid="button-create-assignment"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Assignment
          </Button>
        )}

        {/* Assignment Creator */}
        {showCreator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Create Assignment</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCreator(false)}
                data-testid="button-cancel-assignment"
              >
                Cancel
              </Button>
            </div>

            {/* Assignment Name */}
            <div className="space-y-2">
              <Label htmlFor="assignment-name">Assignment Name</Label>
              <Input
                id="assignment-name"
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder="e.g., Week 1 Reading Practice"
                data-testid="input-assignment-name"
              />
            </div>

            {/* Expiry Settings */}
            <div className="space-y-2">
              <Label htmlFor="expiry-days">Expires After (Optional)</Label>
              <Select value={expiryDays?.toString() || 'never'} onValueChange={(value) => 
                setExpiryDays(value === 'never' ? undefined : Number(value))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filter by Subject</Label>
                <Select value={biomeFilter} onValueChange={setBiomeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {Object.entries(SUBJECTS).map(([biome, subject]) => (
                      <SelectItem key={biome} value={biome}>
                        {subject.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Filter by Standard</Label>
                <Input
                  value={standardFilter}
                  onChange={(e) => setStandardFilter(e.target.value)}
                  placeholder="Search standards..."
                />
              </div>
            </div>

            {/* Lesson Selection */}
            <div className="space-y-2">
              <Label>Select Lessons ({selectedLessons.length} selected)</Label>
              <div className="max-h-64 overflow-y-auto border rounded p-3 bg-white">
                {filteredLessons.length === 0 ? (
                  <p className="text-sm text-gray-500">No lessons match the current filters.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredLessons.map((lesson) => (
                      <div 
                        key={lesson.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                      >
                        <Checkbox
                          id={`lesson-${lesson.id}`}
                          checked={selectedLessons.includes(lesson.id)}
                          onCheckedChange={() => handleLessonToggle(lesson.id)}
                          data-testid={`checkbox-lesson-${lesson.id}`}
                        />
                        <label 
                          htmlFor={`lesson-${lesson.id}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lesson.title}</span>
                            <Badge 
                              variant="secondary" 
                              style={{ backgroundColor: SUBJECTS[lesson.biome as keyof typeof SUBJECTS]?.color + '20' }}
                            >
                              {SUBJECTS[lesson.biome as keyof typeof SUBJECTS]?.label}
                            </Badge>
                            <Badge variant="outline">Loop {lesson.loop}</Badge>
                          </div>
                          {lesson.standards?.[selectedFramework as keyof typeof lesson.standards] && (
                            <div className="text-xs text-gray-500 mt-1">
                              {lesson.standards[selectedFramework as keyof typeof lesson.standards]}
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Lessons Preview */}
            {selectedLessonsData.length > 0 && (
              <div className="space-y-2">
                <Label>Assignment Path ({selectedLessonsData.length} lessons)</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedLessonsData.map((lesson, index) => (
                    <Badge key={lesson.id} variant="outline" className="flex items-center gap-1">
                      <span className="text-xs">{index + 1}.</span>
                      {lesson.title}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => handleLessonToggle(lesson.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Create Button */}
            <Button 
              onClick={handleCreateAssignment}
              disabled={!assignmentName.trim() || selectedLessons.length === 0}
              className="w-full"
              data-testid="button-create-path"
            >
              <Target className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </motion.div>
        )}

        {/* Generated Assignment */}
        {generatedPath && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 border rounded-lg p-4 bg-green-50 border-green-200"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h4 className="font-medium text-green-800">Assignment Created!</h4>
            </div>
            
            <div className="space-y-2">
              <div>
                <Label className="text-green-700">Assignment Name:</Label>
                <p className="font-medium">{generatedPath.name}</p>
              </div>
              
              <div>
                <Label className="text-green-700">Short Code (for offline):</Label>
                <p className="font-mono text-sm">{generateShortCode(generatedPath)}</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleCopyLink(generatedPath)}
                  data-testid="button-copy-assignment-link"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setGeneratedPath(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Assignments */}
        {activePaths.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Active Assignments ({activePaths.length})
            </h4>
            
            <div className="space-y-2">
              {activePaths.map((path) => (
                <div 
                  key={path.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h5 className="font-medium">{path.name}</h5>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{path.lessonIds.length} lessons</span>
                      <span>Created {new Date(path.createdAt).toLocaleDateString()}</span>
                      {path.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {new Date(path.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Code: <span className="font-mono">{generateShortCode(path)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyLink(path)}
                      data-testid={`button-copy-link-${path.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete assignment "${path.name}"?`)) {
                          deletePath(path.id);
                          // Force re-render by updating a state
                          setGeneratedPath(null);
                        }
                      }}
                      data-testid={`button-delete-${path.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}