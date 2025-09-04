import React, { useState } from 'react';
import { Settings, Users, Copy, Trash2, Plus, Star, Projector, Check } from 'lucide-react';
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
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';

export function Classes() {
  const rosterContext = useRosterOptional();
  const activeLearner = rosterContext?.activeLearner;
  
  // Simple toast implementation
  const toast = (message: { title: string; description?: string; variant?: string }) => {
    alert(`${message.title}${message.description ? '\n' + message.description : ''}`);
  };

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
      toast({
        title: "Active class updated",
        description: "Class is now active and its projector settings will be applied."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set active class",
        variant: "destructive"
      });
    }
  };

  const handleClearActive = () => {
    if (!activeLearner) return;
    
    try {
      setActiveClass(activeLearner.id, undefined);
      setActiveClassId(undefined);
      toast({
        title: "Active class cleared",
        description: "No class is now active."
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to clear active class",
        variant: "destructive"
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
      
      toast({
        title: "Class updated",
        description: "Class name has been updated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update class name",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (classId: string) => {
    if (!activeLearner) return;

    try {
      deleteClass(activeLearner.id, classId);
      refreshData();
      setDeleteConfirm(null);
      
      toast({
        title: "Class deleted",
        description: "Class has been removed."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete class",
        variant: "destructive"
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

      toast({
        title: "Class created",
        description: `Class "${newClass.name}" has been created with code ${newClass.code}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive"
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied",
      description: `Class code ${code} copied to clipboard.`
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
      toast({
        title: "Error",
        description: "Failed to update projector settings",
        variant: "destructive"
      });
    }
  };

  if (!activeLearner) {
    return <div className="p-4 text-sm text-gray-500">Please select a learner to manage classes.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Class Management</h2>
          <p className="text-sm text-gray-600">Manage classes and projector display settings</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
          data-testid="button-add-class"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </Button>
      </div>

      {/* Add Class Form */}
      {showAddForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-3">Create New Class</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Class name (e.g., Room 12A)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddClass();
                } else if (e.key === 'Escape') {
                  setShowAddForm(false);
                  setNewClassName('');
                }
              }}
              data-testid="input-new-class-name"
            />
            <Button onClick={handleAddClass} disabled={!newClassName.trim()}>
              Create
            </Button>
            <Button 
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

      {/* Active Class Info */}
      {activeClassId && (
        <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Active Class: {classes.find(c => c.id === activeClassId)?.name}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearActive}
              data-testid="button-clear-active"
            >
              Clear Active
            </Button>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div className="space-y-4">
        {classes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No classes yet. Create your first class to get started.</p>
          </div>
        ) : (
          classes.map((classInfo) => {
            const isActive = classInfo.id === activeClassId;
            const isEditing = editingClass === classInfo.id;
            const isDeleting = deleteConfirm === classInfo.id;

            return (
              <div key={classInfo.id} className={`border rounded-lg p-4 ${isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                {/* Class Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              setEditingClass(null);
                              setEditName('');
                            }
                          }}
                          className="flex-1"
                          data-testid={`input-edit-class-${classInfo.id}`}
                        />
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingClass(null);
                            setEditName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{classInfo.name}</h3>
                        {isActive && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Code: <span className="font-mono font-medium">{classInfo.code}</span></span>
                      <span>Created: {new Date(classInfo.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(classInfo.id)}
                        data-testid={`button-set-active-${classInfo.id}`}
                      >
                        <Star className="w-4 h-4" />
                        Set Active
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyCode(classInfo.code || '')}
                      data-testid={`button-copy-code-${classInfo.id}`}
                    >
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </Button>

                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditName(classInfo)}
                        data-testid={`button-edit-${classInfo.id}`}
                      >
                        <Settings className="w-4 h-4" />
                        Edit
                      </Button>
                    )}

                    {!isDeleting ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirm(classInfo.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${classInfo.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(classInfo.id)}
                          data-testid={`button-confirm-delete-${classInfo.id}`}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Projector Presets */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Projector className="w-4 h-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Projector Display Settings</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hide Names Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Hide Learner Names (PII)</label>
                        <p className="text-xs text-gray-600">Protect privacy on projectors</p>
                      </div>
                      <Switch
                        checked={classInfo.projectorPreset?.hideNames || false}
                        onCheckedChange={(checked) => updateProjectorPreset(classInfo.id, 'hideNames', checked)}
                        data-testid={`switch-hide-names-${classInfo.id}`}
                      />
                    </div>

                    {/* Font Scale Slider */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 block mb-2">
                        Font Scale: {(classInfo.projectorPreset?.fontScale || 1.0).toFixed(1)}x
                      </label>
                      <Slider
                        value={[classInfo.projectorPreset?.fontScale || 1.0]}
                        onValueChange={([value]) => updateProjectorPreset(classInfo.id, 'fontScale', value)}
                        min={1.0}
                        max={1.4}
                        step={0.1}
                        className="w-full"
                        data-testid={`slider-font-scale-${classInfo.id}`}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1.0x</span>
                        <span>1.4x</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}