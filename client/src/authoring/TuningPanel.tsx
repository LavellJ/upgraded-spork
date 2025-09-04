/**
 * Tuning Panel - Interface for managing tuning notes in Content Studio
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Settings, Trash2, Save, X, AlertTriangle, 
  TrendingUp, TrendingDown, MessageCircle, Edit3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { 
  getTuningNotesById,
  saveTuningNote,
  deleteTuningNote,
  createTuningId,
  getTuningStats,
  applyTuning,
  type TuningNote 
} from './tuning';

interface TuningPanelProps {
  lessonId: string;
}

export function TuningPanel({ lessonId }: TuningPanelProps) {
  const [notes, setNotes] = useState<TuningNote[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<TuningNote | null>(null);
  const [stats, setStats] = useState(getTuningStats());

  // New note form state
  const [newNote, setNewNote] = useState({
    difficultyDelta: 0,
    hintAdds: '',
    wording: '',
    rationale: '',
    author: ''
  });

  useEffect(() => {
    loadNotes();
  }, [lessonId]);

  const loadNotes = () => {
    const lessonNotes = getTuningNotesById(lessonId);
    setNotes(lessonNotes);
    setStats(getTuningStats());
  };

  const handleCreateNote = () => {
    try {
      const tuningNote: TuningNote = {
        id: createTuningId('lesson', lessonId),
        at: Date.now(),
        kind: 'lesson',
        change: {
          difficultyDelta: newNote.difficultyDelta as -2 | -1 | 1 | 2 || undefined,
          hintAdds: newNote.hintAdds.trim() ? newNote.hintAdds.split('\n').filter(h => h.trim()) : undefined,
          wording: newNote.wording.trim() || undefined
        },
        rationale: newNote.rationale.trim() || undefined,
        author: newNote.author.trim() || undefined
      };

      saveTuningNote(tuningNote);
      applyTuning(tuningNote);
      
      // Reset form
      setNewNote({
        difficultyDelta: 0,
        hintAdds: '',
        wording: '',
        rationale: '',
        author: ''
      });
      setIsCreating(false);
      loadNotes();
    } catch (error) {
      console.error('Failed to create tuning note:', error);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Delete this tuning note? This cannot be undone.')) {
      try {
        deleteTuningNote(noteId);
        loadNotes();
      } catch (error) {
        console.error('Failed to delete tuning note:', error);
      }
    }
  };

  const handleApplyNote = (note: TuningNote) => {
    applyTuning(note);
    console.log('Applied tuning note:', note.id);
  };

  const getDifficultyIcon = (delta?: number) => {
    if (!delta) return null;
    if (delta > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  const getDifficultyLabel = (delta?: number) => {
    if (!delta) return '';
    const magnitude = Math.abs(delta);
    const direction = delta > 0 ? 'Harder' : 'Easier';
    const intensity = magnitude === 1 ? '' : ' (Strong)';
    return `${direction}${intensity}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tuning Notes</h3>
          <p className="text-sm text-gray-600">
            Adjust difficulty and hints without rewriting content
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setIsCreating(true)}
          data-testid="button-create-tuning-note"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{notes.length}</div>
            <div className="text-sm text-gray-600">Notes for this lesson</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalNotes}</div>
            <div className="text-sm text-gray-600">Total notes</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              New Tuning Note
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Difficulty Adjustment
              </label>
              <Select 
                value={newNote.difficultyDelta.toString()} 
                onValueChange={(value) => setNewNote(prev => ({ ...prev, difficultyDelta: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No change</SelectItem>
                  <SelectItem value="-2">Much easier (-2)</SelectItem>
                  <SelectItem value="-1">Easier (-1)</SelectItem>
                  <SelectItem value="1">Harder (+1)</SelectItem>
                  <SelectItem value="2">Much harder (+2)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional Hints (one per line)
              </label>
              <Textarea
                placeholder="Add helpful hints..."
                value={newNote.hintAdds}
                onChange={(e) => setNewNote(prev => ({ ...prev, hintAdds: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Wording Adjustments
              </label>
              <Textarea
                placeholder="Alternative wording or clarifications..."
                value={newNote.wording}
                onChange={(e) => setNewNote(prev => ({ ...prev, wording: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Rationale
              </label>
              <Textarea
                placeholder="Why is this adjustment needed?"
                value={newNote.rationale}
                onChange={(e) => setNewNote(prev => ({ ...prev, rationale: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Author
              </label>
              <Input
                placeholder="Your name"
                value={newNote.author}
                onChange={(e) => setNewNote(prev => ({ ...prev, author: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreateNote}>
                <Save className="w-4 h-4 mr-2" />
                Save Note
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Notes */}
      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {note.author || 'Anonymous'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {note.kind}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyNote(note)}
                      title="Apply this tuning note"
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {note.change.difficultyDelta && (
                    <div className="flex items-center gap-2">
                      {getDifficultyIcon(note.change.difficultyDelta)}
                      <span className="text-sm">
                        {getDifficultyLabel(note.change.difficultyDelta)}
                      </span>
                    </div>
                  )}

                  {note.change.hintAdds && note.change.hintAdds.length > 0 && (
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Additional Hints:</div>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {note.change.hintAdds.map((hint, index) => (
                            <li key={index}>{hint}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {note.change.wording && (
                    <div className="flex items-start gap-2">
                      <Edit3 className="w-4 h-4 text-purple-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">Wording:</div>
                        <div className="text-sm text-gray-600">{note.change.wording}</div>
                      </div>
                    </div>
                  )}

                  {note.rationale && (
                    <div className="text-sm text-gray-600 italic mt-2 border-l-2 border-gray-200 pl-3">
                      {note.rationale}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 mt-3">
                  Created {new Date(note.at).toLocaleDateString()} at {new Date(note.at).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h4 className="font-medium text-gray-700 mb-2">No Tuning Notes</h4>
          <p className="text-sm text-gray-500 mb-4">
            Create tuning notes to adjust difficulty and hints for this lesson
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Note
          </Button>
        </div>
      )}
    </div>
  );
}