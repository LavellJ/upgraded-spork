import React, { useState } from 'react';
import { useRoster } from '../roster/context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Plus, Edit2, Trash2, User } from 'lucide-react';
import type { LearnerProfile } from '../roster/model';

interface AddLearnerFormProps {
  onComplete: (learner: { name: string; avatarId: string; ageBand: LearnerProfile['ageBand'] }) => void;
  onCancel: () => void;
}

function AddLearnerForm({ onComplete, onCancel }: AddLearnerFormProps) {
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState('avatar-1');
  const [ageBand, setAgeBand] = useState<LearnerProfile['ageBand']>('primary');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete({ name: name.trim(), avatarId, ageBand });
    }
  };

  const avatarOptions = [
    { id: 'avatar-1', name: '🐨 Koala', emoji: '🐨' },
    { id: 'avatar-2', name: '🦘 Kangaroo', emoji: '🦘' },
    { id: 'avatar-3', name: '🐊 Crocodile', emoji: '🐊' },
    { id: 'avatar-4', name: '🐍 Snake', emoji: '🐍' },
    { id: 'avatar-5', name: '🦎 Lizard', emoji: '🦎' },
    { id: 'avatar-6', name: '🐢 Turtle', emoji: '🐢' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="learner-name">Name</Label>
        <Input
          id="learner-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter learner's name"
          maxLength={20}
          data-testid="input-learner-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="learner-avatar">Avatar</Label>
        <Select value={avatarId} onValueChange={setAvatarId}>
          <SelectTrigger data-testid="select-learner-avatar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {avatarOptions.map((avatar) => (
              <SelectItem key={avatar.id} value={avatar.id}>
                <div className="flex items-center gap-2">
                  <span>{avatar.emoji}</span>
                  <span>{avatar.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="learner-age">Age Group</Label>
        <Select value={ageBand} onValueChange={(value: LearnerProfile['ageBand']) => setAgeBand(value)}>
          <SelectTrigger data-testid="select-learner-age">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pre-primary">Pre-Primary (3-5 years)</SelectItem>
            <SelectItem value="primary">Primary (6-8 years)</SelectItem>
            <SelectItem value="upper-primary">Upper Primary (9-12 years)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={!name.trim()} data-testid="button-create-learner">
          Create Learner
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-learner">
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface EditLearnerFormProps {
  learner: LearnerProfile;
  onComplete: (updates: Partial<Omit<LearnerProfile, 'id' | 'createdAt'>>) => void;
  onCancel: () => void;
}

function EditLearnerForm({ learner, onComplete, onCancel }: EditLearnerFormProps) {
  const [name, setName] = useState(learner.name);
  const [avatarId, setAvatarId] = useState(learner.avatarId);
  const [ageBand, setAgeBand] = useState(learner.ageBand);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete({ name: name.trim(), avatarId, ageBand });
    }
  };

  const avatarOptions = [
    { id: 'avatar-1', name: '🐨 Koala', emoji: '🐨' },
    { id: 'avatar-2', name: '🦘 Kangaroo', emoji: '🦘' },
    { id: 'avatar-3', name: '🐊 Crocodile', emoji: '🐊' },
    { id: 'avatar-4', name: '🐍 Snake', emoji: '🐍' },
    { id: 'avatar-5', name: '🦎 Lizard', emoji: '🦎' },
    { id: 'avatar-6', name: '🐢 Turtle', emoji: '🐢' }
  ];

  const selectedAvatar = avatarOptions.find(a => a.id === avatarId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-learner-name">Name</Label>
        <Input
          id="edit-learner-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter learner's name"
          maxLength={20}
          data-testid="input-edit-learner-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-learner-avatar">Avatar</Label>
        <Select value={avatarId} onValueChange={setAvatarId}>
          <SelectTrigger data-testid="select-edit-learner-avatar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {avatarOptions.map((avatar) => (
              <SelectItem key={avatar.id} value={avatar.id}>
                <div className="flex items-center gap-2">
                  <span>{avatar.emoji}</span>
                  <span>{avatar.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-learner-age">Age Group</Label>
        <Select value={ageBand} onValueChange={(value: LearnerProfile['ageBand']) => setAgeBand(value)}>
          <SelectTrigger data-testid="select-edit-learner-age">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pre-primary">Pre-Primary (3-5 years)</SelectItem>
            <SelectItem value="primary">Primary (6-8 years)</SelectItem>
            <SelectItem value="upper-primary">Upper Primary (9-12 years)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={!name.trim()} data-testid="button-save-learner">
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-edit">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function RosterManagement() {
  const { roster, activeLearner, isLoading, switchLearner, createLearner, editLearner, removeLearner } = useRoster();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLearner, setEditingLearner] = useState<LearnerProfile | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Learners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Initializing roster...</div>
        </CardContent>
      </Card>
    );
  }

  if (!roster) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Learners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">Error loading roster</div>
        </CardContent>
      </Card>
    );
  }

  const handleAddLearner = async (learnerData: { name: string; avatarId: string; ageBand: LearnerProfile['ageBand'] }) => {
    try {
      await createLearner(learnerData.name, learnerData.avatarId, learnerData.ageBand);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create learner:', error);
    }
  };

  const handleEditLearner = (updates: Partial<Omit<LearnerProfile, 'id' | 'createdAt'>>) => {
    if (!editingLearner) return;
    
    editLearner(editingLearner.id, updates);
    setEditingLearner(null);
  };

  const handleDeleteLearner = (learnerId: string) => {
    // Don't allow deleting the last learner
    if (roster.learners.length <= 1) {
      return;
    }
    
    removeLearner(learnerId);
  };

  const canDelete = roster.learners.length > 1;

  const getAvatarEmoji = (avatarId: string) => {
    const avatarMap: Record<string, string> = {
      'avatar-1': '🐨',
      'avatar-2': '🦘', 
      'avatar-3': '🐊',
      'avatar-4': '🐍',
      'avatar-5': '🦎',
      'avatar-6': '🐢'
    };
    return avatarMap[avatarId] || '👤';
  };

  const getAgeBandLabel = (ageBand: LearnerProfile['ageBand']) => {
    switch (ageBand) {
      case 'pre-primary': return 'Pre-Primary';
      case 'primary': return 'Primary';
      case 'upper-primary': return 'Upper Primary';
      default: return ageBand;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Learners ({roster.learners.length})
          </div>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-learner">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Learner</DialogTitle>
              </DialogHeader>
              <AddLearnerForm
                onComplete={handleAddLearner}
                onCancel={() => setShowAddForm(false)}
              />
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {roster.learners.map((learner) => (
          <div
            key={learner.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              learner.id === activeLearner?.id 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            data-testid={`learner-card-${learner.id}`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-lg">
                  {getAvatarEmoji(learner.avatarId)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{learner.name}</span>
                  {learner.id === activeLearner?.id && (
                    <Badge variant="secondary" className="text-xs" data-testid="badge-active-learner">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {getAgeBandLabel(learner.ageBand)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {learner.id !== activeLearner?.id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => switchLearner(learner.id)}
                  data-testid={`button-switch-${learner.id}`}
                >
                  <User className="h-3 w-3" />
                  Switch
                </Button>
              )}

              <Dialog open={editingLearner?.id === learner.id} onOpenChange={(open) => !open && setEditingLearner(null)}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingLearner(learner)}
                    data-testid={`button-edit-${learner.id}`}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit {learner.name}</DialogTitle>
                  </DialogHeader>
                  {editingLearner && (
                    <EditLearnerForm
                      learner={editingLearner}
                      onComplete={handleEditLearner}
                      onCancel={() => setEditingLearner(null)}
                    />
                  )}
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!canDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-delete-${learner.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent role="alertdialog">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {learner.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {learner.name}'s profile and all their progress data. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteLearner(learner.id)}
                      className="bg-red-600 hover:bg-red-700"
                      data-testid="button-confirm-delete"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {roster.learners.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No learners added yet</p>
            <p className="text-xs">Click "Add" to create the first learner</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}