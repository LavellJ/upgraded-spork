import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  Calendar,
  AlertTriangle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Save,
  X
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { 
  loadPathsV2, 
  savePathsV2, 
  upsertPathV2, 
  deletePathV2, 
  getActiveAssignments,
  type AssignedPathV2, 
  type AssignedLesson,
  type AssignedLessonStatus
} from './assign';
import { useRosterOptional } from '../roster';
import registryData from '../data/registry.json';
import loop1Data from '../data/loop1.json';
import loop2Data from '../data/loop2.json';

interface AssignmentsManagerProps {
  className?: string;
}

export function AssignmentsManager({ className = '' }: AssignmentsManagerProps) {
  const rosterContext = useRosterOptional();
  const learnerId = rosterContext?.activeLearner?.id;
  
  const [assignments, setAssignments] = useState<AssignedPathV2[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    startAt: '',
    dueAt: '',
    lessons: [] as AssignedLesson[]
  });
  
  const [availableLessons] = useState(() => {
    const lessons: { id: string; title: string; biome: string }[] = [];
    
    // Process registry data
    Object.entries(registryData).forEach(([loopNum, loopData]) => {
      Object.entries(loopData).forEach(([biome, biomeData]) => {
        Object.entries(biomeData).forEach(([lessonId, lessonData]) => {
          lessons.push({
            id: lessonId,
            title: lessonId, // Use lesson ID as title for now
            biome: biome
          });
        });
      });
    });
    
    // Process loop data to get actual titles
    const loopDataSets = [loop1Data, loop2Data];
    loopDataSets.forEach(loopData => {
      Object.entries(loopData).forEach(([biome, biomeData]) => {
        Object.entries(biomeData).forEach(([lessonId, lessonContent]) => {
          const existingLesson = lessons.find(l => l.id === lessonId);
          if (existingLesson && lessonContent.title) {
            existingLesson.title = lessonContent.title;
          } else if (lessonContent.title) {
            lessons.push({
              id: lessonId,
              title: lessonContent.title,
              biome: biome
            });
          }
        });
      });
    });
    
    return lessons;
  });

  const loadAssignments = () => {
    if (!learnerId) return;
    const paths = loadPathsV2(learnerId);
    setAssignments(paths);
  };

  useEffect(() => {
    loadAssignments();
  }, [learnerId]);

  const handleSave = () => {
    if (!learnerId || !formData.name.trim() || formData.lessons.length === 0) return;
    
    const now = Date.now();
    const path: AssignedPathV2 = {
      id: editingId || nanoid(),
      name: formData.name.trim(),
      lessonIds: formData.lessons.map(l => l.lessonId),
      lessons: formData.lessons,
      createdAt: editingId ? assignments.find(a => a.id === editingId)?.createdAt || now : now,
      updatedAt: now,
      startAt: formData.startAt ? new Date(formData.startAt).getTime() : undefined,
      dueAt: formData.dueAt ? new Date(formData.dueAt).getTime() : undefined,
      priority: formData.priority
    };
    
    upsertPathV2(path, learnerId);
    loadAssignments();
    resetForm();
  };

  const handleEdit = (assignment: AssignedPathV2) => {
    setEditingId(assignment.id);
    setFormData({
      name: assignment.name,
      priority: assignment.priority || 'normal',
      startAt: assignment.startAt ? new Date(assignment.startAt).toISOString().slice(0, 16) : '',
      dueAt: assignment.dueAt ? new Date(assignment.dueAt).toISOString().slice(0, 16) : '',
      lessons: [...assignment.lessons]
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!learnerId) return;
    if (confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      deletePathV2(id, learnerId);
      loadAssignments();
    }
  };

  const handleArchive = (id: string, archived: boolean) => {
    if (!learnerId) return;
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;
    
    const updated = { ...assignment, archived, updatedAt: Date.now() };
    upsertPathV2(updated, learnerId);
    loadAssignments();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      priority: 'normal',
      startAt: '',
      dueAt: '',
      lessons: []
    });
    setEditingId(null);
    setShowForm(false);
  };

  const addLesson = (lessonId: string) => {
    const lesson = availableLessons.find(l => l.id === lessonId);
    if (!lesson || formData.lessons.find(l => l.lessonId === lessonId)) return;
    
    const newLesson: AssignedLesson = {
      lessonId,
      status: 'not_started'
    };
    
    setFormData(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson]
    }));
  };

  const removeLesson = (lessonId: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.filter(l => l.lessonId !== lessonId)
    }));
  };

  const moveLessonUp = (index: number) => {
    if (index === 0) return;
    const newLessons = [...formData.lessons];
    [newLessons[index - 1], newLessons[index]] = [newLessons[index], newLessons[index - 1]];
    setFormData(prev => ({ ...prev, lessons: newLessons }));
  };

  const moveLessonDown = (index: number) => {
    if (index === formData.lessons.length - 1) return;
    const newLessons = [...formData.lessons];
    [newLessons[index], newLessons[index + 1]] = [newLessons[index + 1], newLessons[index]];
    setFormData(prev => ({ ...prev, lessons: newLessons }));
  };

  const updateLessonDue = (lessonId: string, dueAt: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons.map(l => 
        l.lessonId === lessonId 
          ? { ...l, dueAt: dueAt ? new Date(dueAt).getTime() : undefined }
          : l
      )
    }));
  };

  const filteredAssignments = showArchived 
    ? assignments 
    : assignments.filter(a => !a.archived);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (!learnerId) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        No active learner selected. Please select a learner to manage assignments.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">Assignments Manager</h3>
          <span className="text-xs text-gray-500">
            ({filteredAssignments.length} {showArchived ? 'total' : 'active'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Assignment List */}
      <div className="space-y-2">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {showArchived ? 'No assignments found.' : 'No active assignments. Create one to get started.'}
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div 
              key={assignment.id}
              className={`p-3 border rounded-lg ${assignment.archived ? 'bg-gray-50 opacity-75' : 'bg-white'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-800 truncate">{assignment.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${getPriorityColor(assignment.priority)}`}>
                      {assignment.priority || 'normal'}
                    </span>
                    {assignment.archived && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                        Archived
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{assignment.lessons.length} lessons</div>
                    {assignment.dueAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(assignment.dueAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleEdit(assignment)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleArchive(assignment.id, !assignment.archived)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    title={assignment.archived ? 'Unarchive' : 'Archive'}
                  >
                    {assignment.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(assignment.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">
                {editingId ? 'Edit Assignment' : 'Create Assignment'}
              </h4>
              <button
                onClick={resetForm}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Assignment Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    placeholder="e.g. Week 1 Math Practice"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, startAt: e.target.value }))}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Due Date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueAt: e.target.value }))}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                  />
                </div>
              </div>

              {/* Lessons */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Lessons * ({formData.lessons.length} selected)
                </label>
                
                {/* Add Lesson */}
                <div className="mb-3">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addLesson(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    defaultValue=""
                  >
                    <option value="">Add a lesson...</option>
                    {availableLessons
                      .filter(lesson => !formData.lessons.find(l => l.lessonId === lesson.id))
                      .map(lesson => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title} ({lesson.biome})
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Selected Lessons */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.lessons.map((lesson, index) => {
                    const lessonInfo = availableLessons.find(l => l.id === lesson.lessonId);
                    return (
                      <div
                        key={lesson.lessonId}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                      >
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveLessonUp(index)}
                            disabled={index === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveLessonDown(index)}
                            disabled={index === formData.lessons.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {lessonInfo?.title || lesson.lessonId}
                          </div>
                          <div className="text-xs text-gray-500">
                            {lessonInfo?.biome}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={lesson.dueAt ? new Date(lesson.dueAt).toISOString().slice(0, 16) : ''}
                            onChange={(e) => updateLessonDue(lesson.lessonId, e.target.value)}
                            className="px-1 py-0.5 border rounded text-xs w-36"
                            placeholder="Due date"
                            title="Individual due date (overrides assignment due date)"
                          />
                          
                          <button
                            onClick={() => removeLesson(lesson.lessonId)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  onClick={resetForm}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim() || formData.lessons.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}