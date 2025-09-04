import { statements, type CollaboratorRow } from './db';

/**
 * Authorization utilities for class collaboration
 */

export type ClassRole = 'owner' | 'co_teacher' | 'viewer';

/**
 * Check if user can manage a class (add/remove collaborators, modify settings)
 * Only owners and co_teachers with elevated permissions can manage
 */
export function canManageClass(userEmail: string, classId: string): boolean {
  try {
    const collaborator = statements.getCollaboratorByEmailAndClass.get(classId, userEmail) as CollaboratorRow | undefined;
    
    if (!collaborator) {
      return false;
    }
    
    // Only owners and co_teachers can manage
    return collaborator.role === 'owner' || collaborator.role === 'co_teacher';
  } catch (error) {
    console.error('Error checking class management permission:', error);
    return false;
  }
}

/**
 * Check if user is the owner of a class
 * Only owners can add/remove collaborators and transfer ownership
 */
export function isOwner(userEmail: string, classId: string): boolean {
  try {
    const collaborator = statements.getCollaboratorByEmailAndClass.get(classId, userEmail) as CollaboratorRow | undefined;
    return collaborator?.role === 'owner';
  } catch (error) {
    console.error('Error checking class ownership:', error);
    return false;
  }
}

/**
 * Check if user has any access to a class (owner, co_teacher, or viewer)
 */
export function canAccessClass(userEmail: string, classId: string): boolean {
  try {
    const collaborator = statements.getCollaboratorByEmailAndClass.get(classId, userEmail) as CollaboratorRow | undefined;
    return !!collaborator;
  } catch (error) {
    console.error('Error checking class access:', error);
    return false;
  }
}

/**
 * Get user's role in a specific class
 */
export function getUserClassRole(userEmail: string, classId: string): ClassRole | null {
  try {
    const collaborator = statements.getCollaboratorByEmailAndClass.get(classId, userEmail) as CollaboratorRow | undefined;
    return collaborator?.role || null;
  } catch (error) {
    console.error('Error getting user class role:', error);
    return null;
  }
}

/**
 * Get all classes where user has any role
 */
export function getUserClasses(userEmail: string): { classId: string; role: ClassRole }[] {
  try {
    const classes = statements.getClassesByCollaborator.all(userEmail) as { classId: string; role: ClassRole }[];
    return classes;
  } catch (error) {
    console.error('Error getting user classes:', error);
    return [];
  }
}

/**
 * Add a collaborator to a class
 * Only owners can add collaborators
 */
export function addCollaborator(
  requesterEmail: string,
  classId: string,
  collaboratorEmail: string,
  role: ClassRole
): { success: boolean; error?: string } {
  try {
    // Check if requester is owner
    if (!isOwner(requesterEmail, classId)) {
      return { success: false, error: 'Only class owners can add collaborators' };
    }

    // Check if collaborator already exists
    const existing = statements.getCollaboratorByEmailAndClass.get(classId, collaboratorEmail) as CollaboratorRow | undefined;
    if (existing) {
      return { success: false, error: 'User is already a collaborator' };
    }

    // Ensure the collaborator email exists in users table
    const user = statements.getUser.get(collaboratorEmail);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Add collaborator
    statements.insertCollaborator.run(classId, collaboratorEmail, role, Date.now());
    
    return { success: true };
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return { success: false, error: 'Failed to add collaborator' };
  }
}

/**
 * Remove a collaborator from a class
 * Only owners can remove collaborators, and owners cannot remove themselves
 */
export function removeCollaborator(
  requesterEmail: string,
  classId: string,
  collaboratorEmail: string
): { success: boolean; error?: string } {
  try {
    // Check if requester is owner
    if (!isOwner(requesterEmail, classId)) {
      return { success: false, error: 'Only class owners can remove collaborators' };
    }

    // Prevent owner from removing themselves
    if (requesterEmail === collaboratorEmail) {
      return { success: false, error: 'Class owners cannot remove themselves' };
    }

    // Check if collaborator exists
    const existing = statements.getCollaboratorByEmailAndClass.get(classId, collaboratorEmail) as CollaboratorRow | undefined;
    if (!existing) {
      return { success: false, error: 'Collaborator not found' };
    }

    // Remove collaborator
    statements.deleteCollaborator.run(classId, collaboratorEmail);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return { success: false, error: 'Failed to remove collaborator' };
  }
}

/**
 * Get all collaborators for a class
 * Only class members can view collaborators
 */
export function getClassCollaborators(
  requesterEmail: string,
  classId: string
): { success: boolean; collaborators?: CollaboratorRow[]; error?: string } {
  try {
    // Check if requester has access to class
    if (!canAccessClass(requesterEmail, classId)) {
      return { success: false, error: 'Access denied' };
    }

    const collaborators = statements.getClassCollaborators.all(classId) as CollaboratorRow[];
    
    return { success: true, collaborators };
  } catch (error) {
    console.error('Error getting class collaborators:', error);
    return { success: false, error: 'Failed to get collaborators' };
  }
}