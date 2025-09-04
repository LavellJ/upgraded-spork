import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Field, Input, Select } from './ui/field';
import { Chip } from './ui/chip';
import { Toolbar } from './ui/toolbar';
import { useCollaborators, type ClassRole, type Collaborator } from '../hooks/useCollaborators';
import { useToast } from '../hooks/use-toast';
import { InlineError } from './ui/inline-error';
import { UserPlus, UserMinus, Mail, Shield, Eye, Crown, Send } from 'lucide-react';

interface CollaboratorsCardProps {
  classId: string;
  currentUserEmail?: string;
  isOwner?: boolean;
}

export function CollaboratorsCard({ classId, currentUserEmail, isOwner = false }: CollaboratorsCardProps) {
  const { collaborators, loading, error, add, remove, refresh } = useCollaborators(classId);
  const { toast } = useToast();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<ClassRole>('co_teacher');
  const [addingCollaborator, setAddingCollaborator] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  
  // Invite functionality
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const handleAddCollaborator = async () => {
    if (!newEmail.trim()) return;

    setAddingCollaborator(true);
    try {
      const success = await add(newEmail.trim().toLowerCase(), newRole);
      
      if (success) {
        setNewEmail('');
        setNewRole('co_teacher');
        setShowAddForm(false);
        toast({
          kind: 'success',
          text: `${newRole === 'co_teacher' ? 'Co-teacher' : 'Viewer'} added successfully`
        });
      }
    } catch (err) {
      // Error is already handled by the hook
    } finally {
      setAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (email: string) => {
    if (email === currentUserEmail) {
      toast({
        kind: 'error',
        text: 'You cannot remove yourself from the class'
      });
      return;
    }

    setRemovingEmail(email);
    try {
      const success = await remove(email);
      
      if (success) {
        toast({
          kind: 'success',
          text: 'Collaborator removed successfully'
        });
      }
    } catch (err) {
      // Error is already handled by the hook
    } finally {
      setRemovingEmail(null);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      toast({
        kind: 'error',
        text: 'Please enter a valid email address'
      });
      return;
    }

    // Check if user is already a collaborator
    const existingCollaborator = collaborators.find(
      c => c.email.toLowerCase() === inviteEmail.trim().toLowerCase()
    );
    if (existingCollaborator) {
      toast({
        kind: 'error',
        text: 'This user is already a collaborator on this class'
      });
      return;
    }

    setSendingInvite(true);
    try {
      const response = await fetch('/api/invite/co-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          classId,
          email: inviteEmail.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInviteEmail('');
        setShowInviteForm(false);
        toast({
          kind: 'success',
          text: `Invitation sent to ${data.invitedEmail}! They will receive an email with a link to join the class.`
        });
      } else {
        const errorMessage = data.error || 'Failed to send invitation';
        toast({
          kind: 'error',
          text: errorMessage
        });
      }
    } catch (err) {
      console.error('Error sending invite:', err);
      toast({
        kind: 'error',
        text: 'Failed to send invitation. Please try again.'
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const getRoleIcon = (role: ClassRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3" />;
      case 'co_teacher':
        return <Shield className="w-3 h-3" />;
      case 'viewer':
        return <Eye className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: ClassRole) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'co_teacher':
        return 'Co-teacher';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  const getRoleChipVariant = (role: ClassRole) => {
    switch (role) {
      case 'owner':
        return 'info' as const;
      case 'co_teacher':
        return 'assigned' as const;
      case 'viewer':
        return 'due' as const;
      default:
        return 'info' as const;
    }
  };

  if (loading && collaborators.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collaborators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-[rgb(var(--fg-muted))]">Loading collaborators...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaborators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <InlineError message={error} onRetry={refresh} />
        )}

        {/* Collaborators List */}
        <div className="space-y-2">
          {collaborators.length === 0 ? (
            <div className="text-sm text-[rgb(var(--fg-muted))] py-2">
              <Mail className="w-4 h-4 inline mr-2" />
              No collaborators yet
            </div>
          ) : (
            collaborators.map((collaborator: Collaborator) => (
              <div 
                key={collaborator.email}
                className="flex items-center justify-between p-2 rounded-md bg-[rgb(var(--bg-soft))] border border-[rgb(var(--border))]"
                data-testid={`collaborator-${collaborator.email}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {getRoleIcon(collaborator.role)}
                  </div>
                  <span className="text-sm font-medium truncate" title={collaborator.email}>
                    {collaborator.email}
                  </span>
                  <Chip kind={getRoleChipVariant(collaborator.role)}>
                    {getRoleLabel(collaborator.role)}
                  </Chip>
                </div>
                
                {isOwner && collaborator.role !== 'owner' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveCollaborator(collaborator.email)}
                    disabled={removingEmail === collaborator.email}
                    data-testid={`button-remove-${collaborator.email}`}
                  >
                    <UserMinus className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Invite & Add Collaborator Forms */}
        {isOwner && (
          <div className="border-t border-[rgb(var(--border))] pt-4">
            {!showAddForm && !showInviteForm ? (
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowInviteForm(true)}
                  className="w-full"
                  data-testid="button-invite-co-teacher"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Invite Co-teacher
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  className="w-full"
                  data-testid="button-add-collaborator"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Collaborator Directly
                </Button>
              </div>
            ) : showInviteForm ? (
              <div className="space-y-3">
                <div className="text-sm text-[rgb(var(--fg-muted))]">
                  Send an email invitation to join this class as a co-teacher
                </div>
                <Field label="Email Address">
                  <Input
                    type="email"
                    placeholder="colleague@school.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendInvite();
                      if (e.key === 'Escape') {
                        setShowInviteForm(false);
                        setInviteEmail('');
                      }
                    }}
                    data-testid="input-invite-email"
                  />
                </Field>

                <Toolbar
                  left={
                    <Button 
                      size="sm" 
                      onClick={handleSendInvite} 
                      disabled={!inviteEmail.trim() || sendingInvite}
                      data-testid="button-send-invite"
                    >
                      <Send className="w-3 h-3 mr-2" />
                      {sendingInvite ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  }
                  right={
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowInviteForm(false);
                        setInviteEmail('');
                      }}
                      data-testid="button-cancel-invite"
                    >
                      Cancel
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-[rgb(var(--fg-muted))]">
                  Add a collaborator directly (they must already have access to LearnOz)
                </div>
                <Field label="Email Address">
                  <Input
                    type="email"
                    placeholder="colleague@school.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCollaborator();
                      if (e.key === 'Escape') {
                        setShowAddForm(false);
                        setNewEmail('');
                      }
                    }}
                    data-testid="input-collaborator-email"
                  />
                </Field>
                
                <Field label="Role">
                  <Select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as ClassRole)}
                    data-testid="select-collaborator-role"
                  >
                    <option value="co_teacher">Co-teacher (Can manage class)</option>
                    <option value="viewer">Viewer (Read-only access)</option>
                  </Select>
                </Field>

                <Toolbar
                  left={
                    <Button 
                      size="sm" 
                      onClick={handleAddCollaborator} 
                      disabled={!newEmail.trim() || addingCollaborator}
                      data-testid="button-confirm-add"
                    >
                      {addingCollaborator ? 'Adding...' : 'Add'}
                    </Button>
                  }
                  right={
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewEmail('');
                        setNewRole('co_teacher');
                      }}
                      data-testid="button-cancel-add"
                    >
                      Cancel
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}