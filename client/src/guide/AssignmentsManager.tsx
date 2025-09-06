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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Toolbar } from '../components/ui/toolbar';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/table';
import { Chip } from '../components/ui/chip';
import { Field, Input, Select } from '../components/ui/field';
import { Pin, type PinState } from '../ui/Pin';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty';
import { Skeleton } from '../components/ui/skeleton';
import { InlineError } from '../components/ui/inline-error';
import { useToast } from '../components/ui/toast';
import { useFlags } from '../config/flags';
import { Button as Button2 } from '../ui2/Button';
import { useToast as useToast2 } from '../ui2/Toast';
import { confirm } from '../ui2/Confirm';
import { Empty } from '../ui2/States';
import { fmtRelative, fmtDate } from '../lib/fmt';
import { copy } from '../copy';
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
import TeacherLayout from './teacher/Layout';

interface AssignmentsManagerProps {
  className?: string;
}

export function AssignmentsManager({ className = '' }: AssignmentsManagerProps) {
  const { teacherPanelV2 } = useFlags();
  const rosterContext = useRosterOptional();
  const learnerId = rosterContext?.activeLearner?.id;
  
  const [assignments, setAssignments] = useState<AssignedPathV2[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const toast2 = useToast2();
  
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
    
    try {
      upsertPathV2(path, learnerId);
      loadAssignments();
      resetForm();
      if (teacherPanelV2) {
        toast2.push({
          title: copy.actions.save,
          body: editingId ? "Assignment updated successfully" : "Assignment created successfully"
        });
      } else {
        toast.push({
          kind: "success",
          text: editingId ? "Assignment updated successfully" : "Assignment created successfully"
        });
      }
    } catch (error) {
      toast.push({
        kind: "error",
        text: "Failed to save assignment"
      });
    }
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

  const handleDelete = async (id: string) => {
    if (!learnerId) return;
    const confirmed = teacherPanelV2 
      ? await confirm({
          title: 'Delete assignment?',
          body: 'This action cannot be undone.'
        })
      : confirm('Are you sure you want to delete this assignment? This action cannot be undone.');
    
    if (confirmed) {
      try {
        deletePathV2(id, learnerId);
        loadAssignments();
        if (teacherPanelV2) {
          toast2.push({
            title: "Assignment deleted",
            body: "Assignment deleted successfully"
          });
        } else {
          toast.push({
            kind: "success",
            text: "Assignment deleted successfully"
          });
        }
      } catch (error) {
        if (teacherPanelV2) {
          toast2.push({
            title: "Error",
            body: "Failed to delete assignment"
          });
        } else {
          toast.push({
            kind: "error",
            text: "Failed to delete assignment"
          });
        }
      }
    }
  };

  const handleArchive = (id: string, archived: boolean) => {
    if (!learnerId) return;
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;
    
    const updated = { ...assignment, archived, updatedAt: Date.now() };
    try {
      upsertPathV2(updated, learnerId);
      loadAssignments();
      toast.push({
        kind: "success",
        text: archived ? "Assignment archived" : "Assignment restored"
      });
    } catch (error) {
      toast.push({
        kind: "error",
        text: "Failed to update assignment"
      });
    }
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
      case 'low': return 'text-fg-base bg-bg-card border-border';
      default: return 'text-brand-600 bg-brand-50 border-brand-200';
    }
  };

  if (!learnerId) {
    return (
      <div className={`p-4 text-center text-fg-muted ${className}`}>
        No active learner selected. Please select a learner to manage assignments.
      </div>
    );
  }

  return (
    <Card className={className}>
      <Toolbar
        left={
          <div className="flex items-center gap-3">
            <Field label="">
              <Select defaultValue="all">
                <option value="all">All ({assignments.length})</option>
                <option value="active">Active ({filteredAssignments.filter(a => !a.archived).length})</option>
              </Select>
            </Field>
          </div>
        }
        right={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Assign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? (
                <>
                  <ArchiveRestore className="w-4 h-4 mr-1" />
                  Hide Archived
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-1" />
                  Show Archived
                </>
              )}
            </Button>
          </div>
        }
      />
      <CardContent>

        <Table>
          <THead>
            <TR>
              <TH>Assignment</TH>
              <TH>Status</TH>
              <TH>Priority</TH>
              <TH>Lessons</TH>
              <TH>Due Date</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filteredAssignments.length === 0 ? (
              <TR>
                <TD colSpan={6} className="p-0">
                  <EmptyState 
                    icon={<Plus className="w-8 h-8" />}
                    title={showArchived ? "No archived assignments" : "No assignments yet"}
                    message={showArchived ? "Archived assignments will appear here" : "Create your first assignment to get started"}
                    actionLabel={showArchived ? undefined : "Create Assignment"}
                    onAction={showArchived ? undefined : () => setShowForm(true)}
                  />
                </TD>
              </TR>
            ) : (
              filteredAssignments.map((assignment) => {
                const status = assignment.archived ? 'archived' : 
                             (assignment.dueAt && assignment.dueAt < Date.now()) ? 'overdue' : 'assigned';
                
                // Map assignment status to pin state
                const pinState: PinState = status === 'archived' ? 'locked' :
                                         status === 'overdue' ? 'overdue' : 'assigned';
                             
                return (
                  <TR key={assignment.id}>
                    <TD className="font-medium">{assignment.name}</TD>
                    <TD>
                      <Pin 
                        state={pinState} 
                        size={16} 
                        ariaLabel={`Status: ${status === 'archived' ? 'Archived' : 
                                               status === 'overdue' ? 'Overdue' : 
                                               'Assigned'}`}
                      />
                    </TD>
                    <TD>
                      <Chip variant={assignment.priority === 'high' ? 'overdue' : 
                                   assignment.priority === 'low' ? 'info' : 'assigned'}>
                        {assignment.priority || 'normal'}
                      </Chip>
                    </TD>
                    <TD>{assignment.lessons.length} lessons</TD>
                    <TD>
                      {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : '-'}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(assignment)}
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleArchive(assignment.id, !assignment.archived)}
                          title={assignment.archived ? 'Unarchive' : 'Archive'}
                        >
                          {assignment.archived ? <ArchiveRestore className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(assignment.id)}
                          className="text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                );
              })
            )}
          </TBody>
        </Table>

      </CardContent>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingId ? 'Edit Assignment' : 'Create Assignment'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-fg-base mb-1">
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
                  <label className="block text-xs font-medium text-fg-base mb-1">
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
                  <label className="block text-xs font-medium text-fg-base mb-1">
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
                  <label className="block text-xs font-medium text-fg-base mb-1">
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
                        className="flex items-center gap-2 p-2 bg-bg-card rounded border border-border"
                      >
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveLessonUp(index)}
                            disabled={index === 0}
                            className="p-0.5 text-fg-muted hover:text-fg-base disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveLessonDown(index)}
                            disabled={index === formData.lessons.length - 1}
                            className="p-0.5 text-fg-muted hover:text-fg-base disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {lessonInfo?.title || lesson.lessonId}
                          </div>
                          <div className="text-xs text-fg-muted">
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
                  className="px-3 py-1.5 text-fg-base hover:bg-bg-elev/60 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim() || formData.lessons.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );

  return teacherPanelV2
    ? <TeacherLayout title="Assignments" subtitle="Create, manage and track">{body}</TeacherLayout>
    : body;
}