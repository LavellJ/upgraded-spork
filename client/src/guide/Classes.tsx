import React, { useState } from 'react';
import { Settings, Users, Copy, Trash2, Plus, Star, Projector, Check, QrCode } from 'lucide-react';
import clsx from 'clsx';
import { useRosterOptional } from '../roster/context';
import { 
  ClassInfo, 
  getAllClasses, 
  upsertClass, 
  deleteClass, 
  setActiveClass, 
  getActiveClass,
  makeClassCode 
} from '../roster/classes';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Toolbar } from '../components/ui/toolbar';
import { Field, Input, Select } from '../components/ui/field';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { createPrintableQRSheet } from '../utils/qr';
import { EmptyState } from '../components/ui/empty';
import { InlineError } from '../components/ui/inline-error';
import { CollaboratorsCard } from '../components/CollaboratorsCard';
import { useToast } from '../components/ui/toast';
import TeacherLayout from './teacher/Layout';
import { useFlags } from '../config/flags';

export function Classes() {
  const { teacherPanelV2 } = useFlags();
  const rosterContext = useRosterOptional();
  const activeLearner = rosterContext?.activeLearner;
  
  const toast = useToast();

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [activeClassId, setActiveClassId] = useState<string | undefined>();
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load data on mount
  React.useEffect(() => {
    if (activeLearner) {
      const allClasses = getAllClasses(activeLearner.id);
      const activeClass = getActiveClass(activeLearner.id);
      setClasses(allClasses);
      setActiveClassId(activeClass?.id);
    }
  }, [activeLearner]);

  const refreshData = () => {
    if (activeLearner) {
      const allClasses = getAllClasses(activeLearner.id);
      const activeClass = getActiveClass(activeLearner.id);
      setClasses(allClasses);
      setActiveClassId(activeClass?.id);
    }
  };

  const handleSetActive = (classId: string) => {
    if (!activeLearner) return;
    
    try {
      setActiveClass(activeLearner.id, classId);
      setActiveClassId(classId);
      toast.push({
        kind: "success",
        text: "Active class updated - projector settings applied"
      });
    } catch (error) {
      toast.push({
        kind: "error",
        text: "Failed to set active class"
      });
    }
  };

  const handleClearActive = () => {
    if (!activeLearner) return;
    
    try {
      setActiveClass(activeLearner.id, undefined);
      setActiveClassId(undefined);
      toast.push({
        kind: "success",
        text: "Active class cleared - no class is now active"
      });
    } catch (error) {
      toast.push({
        kind: "error",
        text: "Failed to clear active class"
      });
    }
  };

  const handleEditName = (classInfo: ClassInfo) => {
    setEditingClass(classInfo.id);
    setEditName(classInfo.name);
  };

  const handleSaveEdit = () => {
    if (!activeLearner || !editingClass || !editName.trim()) return;

    const classToEdit = classes.find(c => c.id === editingClass);
    if (!classToEdit) return;

    try {
      upsertClass(activeLearner.id, {
        ...classToEdit,
        name: editName.trim()
      });
      
      setEditingClass(null);
      setEditName('');
      refreshData();
      
      toast.push({
        kind: "success",
        text: "Class name updated successfully"
      });
    } catch (error) {
      toast.push({
        kind: "error",
        text: "Failed to update class name"
      });
    }
  };

  const handleDelete = (classId: string) => {
    if (!activeLearner) return;

    try {
      deleteClass(activeLearner.id, classId);
      refreshData();
      setDeleteConfirm(null);
      
      toast.push({
        kind: "success",
        text: "Class deleted successfully"
      });
    } catch (error) {
      toast.push({
        kind: "error",
        text: "Failed to delete class"
      });
    }
  };

  const handleAddClass = () => {
    if (!activeLearner || !newClassName.trim()) return;

    try {
      const newClass = upsertClass(activeLearner.id, {
        id: `class-${Date.now()}`,
        name: newClassName.trim(),
        projectorPreset: {
          fontScale: 1.0,
          hideNames: false
        }
      });

      setNewClassName('');
      setShowAddForm(false);
      refreshData();

      toast.push({
        kind: "success",
        text: `Class "${newClass.name}" created with code ${newClass.code}`
      });
    } catch (error) {
      toast.push({
        kind: "error",
        text: "Failed to create class"
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.push({
      kind: "success",
      text: `Class code ${code} copied to clipboard`
    });
  };

  const handlePrintQR = (classInfo: ClassInfo) => {
    const printableQRSheet = createPrintableQRSheet(
      classInfo.code,
      classInfo.name,
      window.location.origin
    );
    
    // Open print window with QR sheet
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printableQRSheet);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
    
    toast.push({
      kind: "success",
      text: `Print-ready QR code for class ${classInfo.name} opened`
    });
  };

  const updateProjectorPreset = (classId: string, key: 'fontScale' | 'hideNames', value: number | boolean) => {
    if (!activeLearner) return;

    const classInfo = classes.find(c => c.id === classId);
    if (!classInfo) return;

    try {
      upsertClass(activeLearner.id, {
        ...classInfo,
        projectorPreset: {
          ...classInfo.projectorPreset,
          [key]: value
        }
      });
      
      refreshData();
    } catch (error) {
      toast.push({
        kind: "error",
        text: "Failed to update projector settings"
      });
    }
  };

  if (!activeLearner) {
    return <div className="p-4 text-sm text-gray-500">Please select a learner to manage classes.</div>;
  }

  const activeClass = classes.find(c => c.id === activeClassId);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* Class List */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {classes.length === 0 ? (
              <EmptyState 
                icon={<Users className="w-8 h-8" />}
                title="No classes yet"
                message="Create your first class to get started with teaching"
                actionLabel="Create Class"
                onAction={() => setShowAddForm(true)}
              />
            ) : (
              classes.map((classInfo) => (
                <button
                  key={classInfo.id}
                  onClick={() => setActiveClassId(classInfo.id)}
                  className={clsx(
                    'w-full text-left px-4 py-3 transition-colors border-b border-[rgb(var(--border))] h-[calc(44px*var(--density))]',
                    'hover:bg-[rgb(var(--bg-soft))]',
                    activeClassId === classInfo.id && 'bg-[rgb(var(--bg-soft))] border-brand'
                  )}
                >
                  <div className="font-medium text-sm">{classInfo.name}</div>
                  <div className="text-xs text-[rgb(var(--fg-muted))]">Code: {classInfo.code}</div>
                </button>
              ))
            )}
          </div>
          <div className="p-4 border-t border-[rgb(var(--border))]">
            {!showAddForm ? (
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="w-full"
                data-testid="button-add-class"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Class
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Class name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddClass();
                    if (e.key === 'Escape') {
                      setShowAddForm(false);
                      setNewClassName('');
                    }
                  }}
                  data-testid="input-new-class-name"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddClass} disabled={!newClassName.trim()}>
                    Create
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewClassName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Class Details */}
      <Card>
        <CardHeader>
          <CardTitle>{activeClass?.name ?? 'No class selected'}</CardTitle>
        </CardHeader>
        {activeClass && (
          <>
            <Toolbar
              left={
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSetActive(activeClass.id)}
                    disabled={activeClass.id === activeClassId}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Set Active
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(activeClass.code || '')}
                    data-testid={`button-copy-code-${activeClass.id}`}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Code
                  </Button>
                </div>
              }
              right={
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrintQR(activeClass)}
                    data-testid={`button-print-qr-${activeClass.id}`}
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    Print QR
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirm(activeClass.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-delete-${activeClass.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              }
            />
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Class name">
                  {editingClass === activeClass.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') {
                            setEditingClass(null);
                            setEditName('');
                          }
                        }}
                        data-testid={`input-edit-class-${activeClass.id}`}
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{activeClass.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditName(activeClass)}
                        data-testid={`button-edit-${activeClass.id}`}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Field>

                <Field label="Projector presets" hint="Defaults when this class is active">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center space-x-2">
                        <Switch
                          checked={activeClass.projectorPreset?.hideNames || false}
                          onCheckedChange={(checked) => updateProjectorPreset(activeClass.id, 'hideNames', checked)}
                          data-testid={`switch-hide-names-${activeClass.id}`}
                        />
                        <span className="text-sm">Hide names</span>
                      </label>
                      
                      <div>
                        <Field label="Font scale">
                          <div className="space-y-2">
                            <Slider
                              value={[activeClass.projectorPreset?.fontScale || 1.0]}
                              onValueChange={([value]) => updateProjectorPreset(activeClass.id, 'fontScale', value)}
                              min={1.0}
                              max={1.4}
                              step={0.1}
                              data-testid={`slider-font-scale-${activeClass.id}`}
                            />
                            <div className="flex justify-between text-xs text-[rgb(var(--fg-muted))]">
                              <span>1.0x</span>
                              <span>1.4x</span>
                            </div>
                          </div>
                        </Field>
                      </div>
                    </div>
                  </div>
                </Field>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Collaborators Management */}
      {activeClass && (
        <CollaboratorsCard 
          classId={activeClass.id}
          currentUserEmail={activeLearner?.id} // TODO: Replace with actual user email when auth is implemented
          isOwner={true} // TODO: Determine ownership based on collaborator data
        />
      )}

    </div>
  );

  return teacherPanelV2
    ? <TeacherLayout title="Classes" subtitle="Manage class lists">{body}</TeacherLayout>
    : body;
}