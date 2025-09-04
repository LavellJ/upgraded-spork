/**
 * Content Studio - In-app authoring preview and validation tool
 * 
 * Provides a three-panel layout for browsing, previewing, and validating lesson content.
 * Left: Lesson list with search and filters
 * Middle: Preview pane with Activity Player in safe preview mode
 * Right: Metadata panel with validation, assets, and quick actions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Eye, Play, Copy, ExternalLink, 
  CheckCircle2, XCircle, AlertTriangle, FileText,
  ChevronRight, ChevronDown, ArrowLeft, ArrowRight,
  Download, Upload, RefreshCw, Code2, FileJson,
  Settings, Info, BookOpen, Layers, Tag,
  Clock, MapPin, Star, Users, Palette
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { getLessons, getLessonById, getSkills } from '../authoring/registry';
import { validateLessonV2 } from '../authoring/schema';
import { tI18n } from '../i18n/text';
import { useLocale } from '../i18n/locale';
import type { LessonV2 } from '../authoring/schema';
import { 
  getAllTuningNotes, 
  getTuningNotesById, 
  saveTuningNote, 
  deleteTuningNote, 
  createTuningId, 
  getTuningStats,
  type TuningNote 
} from '../authoring/tuning';
import { TuningPanel } from './TuningPanel';

interface ContentStudioProps {
  selectedLessonId?: string;
  onLessonChange?: (lessonId: string | null) => void;
  onClose?: () => void;
}

interface LessonListItem {
  id: string;
  title: string;
  biomeId: string;
  skills: string[];
  isValid: boolean;
  validationErrors: string[];
  assetCount: number;
  estimatedTime?: string;
}

interface AssetInfo {
  path: string;
  exists: boolean;
  sizeKB?: number;
  type: 'image' | 'video' | 'audio' | 'document' | 'unknown';
}

const BIOMES = {
  forest: { label: 'Literacy', icon: '🌲', color: 'bg-green-100 text-green-800' },
  desert: { label: 'Math', icon: '🏜️', color: 'bg-orange-100 text-orange-800' },
  ocean: { label: 'Science', icon: '🌊', color: 'bg-blue-100 text-blue-800' },
  night: { label: 'HASS', icon: '🌙', color: 'bg-purple-100 text-purple-800' }
};

export function ContentStudio({ selectedLessonId, onLessonChange, onClose }: ContentStudioProps) {
  const { locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBiome, setFilterBiome] = useState<string>('all');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [filterValid, setFilterValid] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<LessonV2 | null>(null);
  const [lessonList, setLessonList] = useState<LessonListItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [assetInfo, setAssetInfo] = useState<Record<string, AssetInfo>>({});
  
  // Refs for keyboard navigation
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Load and process lessons
  useEffect(() => {
    const lessons = getLessons();
    const processedLessons: LessonListItem[] = lessons.map(lesson => {
      const validation = validateLessonV2(lesson);
      const title = tI18n(lesson.title, locale);
      
      return {
        id: lesson.id,
        title,
        biomeId: lesson.biomeId,
        skills: lesson.skills || [],
        isValid: validation.success,
        validationErrors: validation.success ? [] : validation.errors,
        assetCount: lesson.assets?.length || 0,
        estimatedTime: lesson.meta?.estimatedTime as string
      };
    });

    setLessonList(processedLessons);

    // Auto-select lesson from props
    if (selectedLessonId) {
      const lesson = getLessonById(selectedLessonId);
      if (lesson) {
        setSelectedLesson(lesson);
        const index = processedLessons.findIndex(l => l.id === selectedLessonId);
        setSelectedIndex(index);
      }
    }
  }, [selectedLessonId, locale]);

  // Filter lessons based on search and filters
  const filteredLessons = lessonList.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBiome = filterBiome === 'all' || lesson.biomeId === filterBiome;
    const matchesSkill = filterSkill === 'all' || lesson.skills.includes(filterSkill);
    const matchesValid = filterValid === 'all' || 
                        (filterValid === 'valid' && lesson.isValid) ||
                        (filterValid === 'invalid' && !lesson.isValid);

    return matchesSearch && matchesBiome && matchesSkill && matchesValid;
  });

  // Handle lesson selection
  const handleLessonSelect = useCallback((lessonId: string) => {
    const lesson = getLessonById(lessonId);
    if (lesson) {
      setSelectedLesson(lesson);
      onLessonChange?.(lessonId);
      
      const index = filteredLessons.findIndex(l => l.id === lessonId);
      setSelectedIndex(index);

      // Load asset information
      if (lesson.assets) {
        loadAssetInfo(lesson.assets);
      }
    }
  }, [filteredLessons, onLessonChange]);

  // Load asset information (mock implementation)
  const loadAssetInfo = async (assets: string[]) => {
    const info: Record<string, AssetInfo> = {};
    
    for (const asset of assets) {
      const extension = asset.split('.').pop()?.toLowerCase() || '';
      let type: AssetInfo['type'] = 'unknown';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) type = 'image';
      else if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) type = 'video';
      else if (['mp3', 'wav', 'ogg'].includes(extension)) type = 'audio';
      else if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) type = 'document';

      info[asset] = {
        path: asset,
        exists: true, // Mock: assume all assets exist
        sizeKB: Math.floor(Math.random() * 500) + 50, // Mock size
        type
      };
    }
    
    setAssetInfo(info);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!listRef.current) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (selectedIndex < filteredLessons.length - 1) {
            const newIndex = selectedIndex + 1;
            setSelectedIndex(newIndex);
            handleLessonSelect(filteredLessons[newIndex].id);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (selectedIndex > 0) {
            const newIndex = selectedIndex - 1;
            setSelectedIndex(newIndex);
            handleLessonSelect(filteredLessons[newIndex].id);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && filteredLessons[selectedIndex]) {
            setIsPreviewMode(true);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (isPreviewMode) {
            setIsPreviewMode(false);
          } else {
            onClose?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredLessons, isPreviewMode, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current && selectedIndex >= 0) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  // Quick actions
  const copyLessonId = () => {
    if (selectedLesson) {
      navigator.clipboard.writeText(selectedLesson.id);
    }
  };

  const openJSON = () => {
    if (selectedLesson) {
      const blob = new Blob([JSON.stringify(selectedLesson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
  };

  const openTranscript = () => {
    // Mock implementation - would open transcript file
    console.log('Opening transcript for', selectedLesson?.id);
  };

  const skills = getSkills();
  const selectedLessonItem = lessonList.find(l => l.id === selectedLesson?.id);

  return (
    <div 
      className="h-screen bg-gray-50 flex flex-col"
      role="application"
      aria-label="Content Studio"
      data-testid="content-studio"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-semibold text-gray-900">Content Studio</h1>
            <Badge variant="outline" className="text-xs">Preview & Validate</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              data-testid="button-toggle-preview"
            >
              <Eye className="w-4 h-4 mr-1" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-studio">
                ✕
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Panel: Lesson List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-100">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search lessons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-lesson-search"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Select value={filterBiome} onValueChange={setFilterBiome}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Biome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Biomes</SelectItem>
                    {Object.entries(BIOMES).map(([id, info]) => (
                      <SelectItem key={id} value={id}>
                        {info.icon} {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterValid} onValueChange={setFilterValid}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="valid">✓ Valid</SelectItem>
                    <SelectItem value="invalid">✗ Invalid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={filterSkill} onValueChange={setFilterSkill}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Filter by skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {skills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {tI18n(skill.label, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lesson List */}
          <ScrollArea className="flex-1">
            <div 
              ref={listRef}
              className="p-2"
              role="treegrid"
              aria-label="Lesson list"
              tabIndex={0}
            >
              {filteredLessons.map((lesson, index) => {
                const isSelected = selectedIndex === index;
                const biome = BIOMES[lesson.biomeId as keyof typeof BIOMES];
                
                return (
                  <div
                    key={lesson.id}
                    ref={isSelected ? selectedRef : undefined}
                    className={`
                      p-3 mb-2 rounded-lg border cursor-pointer transition-all
                      ${isSelected 
                        ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-100' 
                        : 'bg-white border-gray-100 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => handleLessonSelect(lesson.id)}
                    role="gridcell"
                    aria-selected={isSelected}
                    data-testid={`lesson-item-${lesson.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{biome?.icon}</span>
                          <span className="font-medium text-sm truncate">{lesson.title}</span>
                          {lesson.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`text-xs ${biome?.color}`}>
                            {biome?.label}
                          </Badge>
                          {lesson.estimatedTime && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {lesson.estimatedTime}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-gray-500">
                          ID: {lesson.id}
                        </div>
                        
                        {lesson.skills.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {lesson.skills.slice(0, 2).map(skillId => (
                              <Badge key={skillId} variant="secondary" className="text-xs">
                                {skillId}
                              </Badge>
                            ))}
                            {lesson.skills.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{lesson.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredLessons.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No lessons found</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* List Footer */}
          <div className="p-3 border-t border-gray-100 text-xs text-gray-500">
            {filteredLessons.length} of {lessonList.length} lessons
            {selectedIndex >= 0 && (
              <span className="ml-2">• {selectedIndex + 1} selected</span>
            )}
          </div>
        </div>

        {/* Middle Panel: Preview */}
        <div className="flex-1 bg-gray-50 flex flex-col">
          {selectedLesson ? (
            isPreviewMode ? (
              <div className="flex-1 p-6">
                <div className="bg-white rounded-lg shadow-sm border h-full p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {tI18n(selectedLesson.title, locale)}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPreviewMode(false)}
                      data-testid="button-exit-preview"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to Edit
                    </Button>
                  </div>
                  
                  {/* Safe Preview Mode Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Preview Mode</span>
                      <Badge variant="outline" className="text-xs">Safe - No Data Saved</Badge>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      This preview runs in safe mode. No progress or events will be recorded.
                    </p>
                  </div>

                  {/* Activity Preview */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="text-center py-12">
                      <Play className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Activity Preview</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Preview mode for lesson activities would be rendered here
                      </p>
                      <p className="text-xs text-gray-400">
                        Activities: {selectedLesson.activities?.length || 0} • 
                        Assets: {selectedLesson.assets?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-6">
                <div className="bg-white rounded-lg shadow-sm border h-full">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold mb-2">
                      {tI18n(selectedLesson.title, locale)}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{BIOMES[selectedLesson.biomeId as keyof typeof BIOMES]?.label}</span>
                      <span>•</span>
                      <span>ID: {selectedLesson.id}</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="activities">Activities</TabsTrigger>
                        <TabsTrigger value="skills">Skills</TabsTrigger>
                        <TabsTrigger value="tuning">Tuning</TabsTrigger>
                        <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="mt-6">
                        <div className="space-y-4">
                          {selectedLesson.summary && (
                            <div>
                              <h3 className="font-medium mb-2">Summary</h3>
                              <p className="text-sm text-gray-600">
                                {tI18n(selectedLesson.summary, locale)}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <h3 className="font-medium mb-2">Metadata</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Version:</span>
                                <span className="ml-2">{selectedLesson.version}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Biome:</span>
                                <span className="ml-2">{selectedLesson.biomeId}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Activities:</span>
                                <span className="ml-2">{selectedLesson.activities?.length || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Assets:</span>
                                <span className="ml-2">{selectedLesson.assets?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="activities" className="mt-6">
                        <div className="space-y-3">
                          {selectedLesson.activities?.map((activity, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{activity.kind}</Badge>
                                <span className="font-medium text-sm">{activity.title}</span>
                              </div>
                              {activity.kind === 'video' && (
                                <div className="text-xs text-gray-500">
                                  Source: {activity.src}
                                </div>
                              )}
                            </div>
                          )) || (
                            <p className="text-sm text-gray-500">No activities defined</p>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="skills" className="mt-6">
                        <div className="space-y-2">
                          {selectedLesson.skills?.map(skillId => (
                            <Badge key={skillId} variant="secondary" className="mr-2 mb-2">
                              {skillId}
                            </Badge>
                          )) || (
                            <p className="text-sm text-gray-500">No skills defined</p>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="tuning" className="mt-6">
                        <TuningPanel lessonId={selectedLesson.id} />
                      </TabsContent>
                      
                      <TabsContent value="raw" className="mt-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="text-xs overflow-auto max-h-96">
                            {JSON.stringify(selectedLesson, null, 2)}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No lesson selected</h3>
                <p className="text-sm text-gray-500">
                  Choose a lesson from the list to preview and validate
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Metadata */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {selectedLesson && selectedLessonItem ? (
            <>
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold mb-2">Lesson Details</h3>
                <div className="text-sm text-gray-600">
                  {tI18n(selectedLesson.title, locale)}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {/* Validation Status */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Schema Validation
                    </h4>
                    {selectedLessonItem.isValid ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Valid</span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          Lesson passes all schema validation checks
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Invalid</span>
                        </div>
                        <div className="space-y-1">
                          {selectedLessonItem.validationErrors.map((error, index) => (
                            <p key={index} className="text-xs text-red-700">
                              • {error}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Asset Check */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Assets ({selectedLesson.assets?.length || 0})
                    </h4>
                    {selectedLesson.assets && selectedLesson.assets.length > 0 ? (
                      <div className="space-y-2">
                        {selectedLesson.assets.map(asset => {
                          const info = assetInfo[asset];
                          return (
                            <div key={asset} className="border border-gray-200 rounded-lg p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono truncate flex-1">
                                  {asset.split('/').pop()}
                                </span>
                                {info?.exists ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-500 ml-2" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-500 ml-2" />
                                )}
                              </div>
                              {info && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {info.type} • {info.sizeKB}KB
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No assets defined</p>
                    )}
                  </div>

                  {/* Standards & Skills */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Standards & Skills
                    </h4>
                    <div className="space-y-3">
                      {selectedLesson.standards && selectedLesson.standards.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Standards</h5>
                          <div className="space-y-1">
                            {selectedLesson.standards.map((standard, index) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                {standard.framework}: {standard.code}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Skills</h5>
                        <div className="space-y-1">
                          {selectedLesson.skills?.map(skillId => (
                            <Badge key={skillId} variant="secondary" className="text-xs mr-1 mb-1">
                              {skillId}
                            </Badge>
                          )) || (
                            <p className="text-xs text-gray-500">No skills assigned</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              <div className="p-4 border-t border-gray-100">
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLessonId}
                    className="w-full justify-start"
                    data-testid="button-copy-lesson-id"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Lesson ID
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openJSON}
                    className="w-full justify-start"
                    data-testid="button-open-json"
                  >
                    <FileJson className="w-4 h-4 mr-2" />
                    Open JSON
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openTranscript}
                    className="w-full justify-start"
                    data-testid="button-open-transcript"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Open Transcript
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewMode(true)}
                    className="w-full justify-start"
                    data-testid="button-quick-preview"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Quick Preview
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Info className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h4 className="font-medium text-gray-700 mb-2">No Selection</h4>
                <p className="text-sm text-gray-500">
                  Select a lesson to view details and validation results
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}