import express from 'express';
import { verifyToken } from '../auth';
import { 
  getClassCollaborators, 
  addCollaborator, 
  removeCollaborator,
  type ClassRole 
} from '../authz';
import { statements } from '../db';
import { auditLog } from '../audit';

const router = express.Router();

// Middleware to verify authentication
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid or missing authentication token' });
  }
  
  // Attach user info to request
  (req as any).user = user;
  next();
}

/**
 * GET /api/classes/:id/collaborators
 * List all collaborators for a class
 */
router.get('/:id/collaborators', requireAuth, async (req, res) => {
  try {
    const classId = req.params.id;
    const userEmail = (req as any).user.email;
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    const result = getClassCollaborators(userEmail, classId);
    
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }

    // Audit log access
    auditLog.auditAccess(userEmail, req.ip);

    res.json({ 
      success: true, 
      collaborators: result.collaborators || [] 
    });
  } catch (error) {
    console.error('Error in GET /api/classes/:id/collaborators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/classes/:id/collaborators
 * Add a collaborator to a class
 * Body: { email: string, role: 'co_teacher' | 'viewer' }
 */
router.post('/:id/collaborators', requireAuth, async (req, res) => {
  try {
    const classId = req.params.id;
    const userEmail = (req as any).user.email;
    const { email: collaboratorEmail, role } = req.body;
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    if (!collaboratorEmail || typeof collaboratorEmail !== 'string') {
      return res.status(400).json({ error: 'Collaborator email is required' });
    }

    if (!role || !['co_teacher', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (co_teacher or viewer)' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(collaboratorEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = addCollaborator(userEmail, classId, collaboratorEmail.toLowerCase().trim(), role as ClassRole);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Audit log collaborator addition
    statements.insertAuditLog.run(
      Date.now(),
      userEmail,
      'collaborator_added',
      JSON.stringify({
        classId,
        collaboratorEmail,
        role,
        ip: req.ip
      })
    );

    res.json({ 
      success: true, 
      message: 'Collaborator added successfully' 
    });
  } catch (error) {
    console.error('Error in POST /api/classes/:id/collaborators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/classes/:id/collaborators/:email
 * Remove a collaborator from a class
 */
router.delete('/:id/collaborators/:email', requireAuth, async (req, res) => {
  try {
    const classId = req.params.id;
    const collaboratorEmail = req.params.email;
    const userEmail = (req as any).user.email;
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    if (!collaboratorEmail) {
      return res.status(400).json({ error: 'Collaborator email is required' });
    }

    const result = removeCollaborator(userEmail, classId, collaboratorEmail);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Audit log collaborator removal
    statements.insertAuditLog.run(
      Date.now(),
      userEmail,
      'collaborator_removed',
      JSON.stringify({
        classId,
        collaboratorEmail,
        ip: req.ip
      })
    );

    res.json({ 
      success: true, 
      message: 'Collaborator removed successfully' 
    });
  } catch (error) {
    console.error('Error in DELETE /api/classes/:id/collaborators/:email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as classesRouter };