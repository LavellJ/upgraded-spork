import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import invitesRouter from '../invites';
import { JWT_SECRET } from '../../config';

// Mock dependencies
jest.mock('../../auth', () => ({
  verifyToken: jest.fn()
}));

jest.mock('../../authz', () => ({
  getClassCollaborators: jest.fn(),
  addCollaborator: jest.fn()
}));

jest.mock('../../db', () => ({
  statements: {
    insertAuditLog: {
      run: jest.fn()
    }
  }
}));

jest.mock('../../email', () => ({
  sendInviteEmail: jest.fn()
}));

import { verifyToken } from '../../auth';
import { getClassCollaborators, addCollaborator } from '../../authz';
import { sendInviteEmail } from '../../email';

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockGetClassCollaborators = getClassCollaborators as jest.MockedFunction<typeof getClassCollaborators>;
const mockAddCollaborator = addCollaborator as jest.MockedFunction<typeof addCollaborator>;
const mockSendInviteEmail = sendInviteEmail as jest.MockedFunction<typeof sendInviteEmail>;

describe('Invites Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/invite', invitesRouter);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /api/invite/co-teacher', () => {
    const validUser = { email: 'owner@school.edu', role: 'guide' };
    const classId = 'class-123';
    const inviteeEmail = 'teacher@school.edu';

    beforeEach(() => {
      mockVerifyToken.mockReturnValue(validUser);
      mockGetClassCollaborators.mockReturnValue({
        success: true,
        collaborators: [
          { email: 'owner@school.edu', role: 'owner', addedAt: Date.now() }
        ]
      });
      mockSendInviteEmail.mockResolvedValue(undefined);
    });

    it('should send invite successfully', async () => {
      const response = await request(app)
        .post('/api/invite/co-teacher')
        .set('Authorization', 'Bearer valid-token')
        .send({ classId, email: inviteeEmail });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.invitedEmail).toBe(inviteeEmail);
      expect(mockSendInviteEmail).toHaveBeenCalledWith(
        inviteeEmail,
        validUser.email,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should reject invite if user is not authenticated', async () => {
      mockVerifyToken.mockReturnValue(null);

      const response = await request(app)
        .post('/api/invite/co-teacher')
        .send({ classId, email: inviteeEmail });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('authentication');
    });

    it('should reject invite if user is not class owner', async () => {
      mockGetClassCollaborators.mockReturnValue({
        success: false,
        error: 'Not authorized'
      });

      const response = await request(app)
        .post('/api/invite/co-teacher')
        .set('Authorization', 'Bearer valid-token')
        .send({ classId, email: inviteeEmail });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('owner');
    });

    it('should reject invite if email is invalid', async () => {
      const response = await request(app)
        .post('/api/invite/co-teacher')
        .set('Authorization', 'Bearer valid-token')
        .send({ classId, email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email format');
    });

    it('should reject invite if user is already a collaborator', async () => {
      mockGetClassCollaborators.mockReturnValue({
        success: true,
        collaborators: [
          { email: 'owner@school.edu', role: 'owner', addedAt: Date.now() },
          { email: inviteeEmail, role: 'co_teacher', addedAt: Date.now() }
        ]
      });

      const response = await request(app)
        .post('/api/invite/co-teacher')
        .set('Authorization', 'Bearer valid-token')
        .send({ classId, email: inviteeEmail });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already a collaborator');
    });

    it('should handle email sending errors', async () => {
      mockSendInviteEmail.mockRejectedValue(new Error('Email service down'));

      const response = await request(app)
        .post('/api/invite/co-teacher')
        .set('Authorization', 'Bearer valid-token')
        .send({ classId, email: inviteeEmail });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Internal server error');
    });
  });

  describe('GET /api/invite/accept', () => {
    const classId = 'class-123';
    const email = 'teacher@school.edu';

    it('should accept valid invite token', async () => {
      const token = jwt.sign({
        kind: 'invite',
        classId,
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      }, JWT_SECRET);

      const response = await request(app)
        .get(`/api/invite/accept?token=${token}`)
        .expect(302);

      expect(response.headers.location).toContain('acceptedInvite=1');
      expect(response.headers.location).toContain(`classId=${encodeURIComponent(classId)}`);
      expect(response.headers.location).toContain(`email=${encodeURIComponent(email)}`);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/invite/accept?token=invalid-token')
        .expect(302);

      expect(response.headers.location).toContain('inviteError=1');
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign({
        kind: 'invite',
        classId,
        email,
        iat: Math.floor(Date.now() / 1000) - (8 * 24 * 60 * 60), // 8 days ago
        exp: Math.floor(Date.now() / 1000) - (1 * 24 * 60 * 60)  // Expired 1 day ago
      }, JWT_SECRET);

      const response = await request(app)
        .get(`/api/invite/accept?token=${expiredToken}`)
        .expect(302);

      expect(response.headers.location).toContain('inviteError=1');
    });

    it('should reject token with wrong kind', async () => {
      const wrongKindToken = jwt.sign({
        kind: 'auth',
        classId,
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      }, JWT_SECRET);

      const response = await request(app)
        .get(`/api/invite/accept?token=${wrongKindToken}`)
        .expect(302);

      expect(response.headers.location).toContain('inviteError=1');
    });
  });

  describe('GET /api/invite/pending', () => {
    const validUser = { email: 'owner@school.edu', role: 'guide' };

    beforeEach(() => {
      mockVerifyToken.mockReturnValue(validUser);
    });

    it('should return empty array when no pending acceptances', async () => {
      const response = await request(app)
        .get('/api/invite/pending')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.pending).toEqual([]);
    });

    it('should return pending acceptances for owned classes', async () => {
      // Mock global pending acceptances
      const mockPending = new Map();
      mockPending.set('class-123:teacher@school.edu', {
        classId: 'class-123',
        email: 'teacher@school.edu',
        role: 'co_teacher' as const,
        acceptedAt: Date.now()
      });
      
      (global as any).pendingInviteAcceptances = mockPending;
      
      mockGetClassCollaborators.mockReturnValue({
        success: true,
        collaborators: []
      });

      const response = await request(app)
        .get('/api/invite/pending')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.pending).toHaveLength(1);
      expect(response.body.pending[0].email).toBe('teacher@school.edu');
    });
  });

  describe('POST /api/invite/process-pending', () => {
    const validUser = { email: 'owner@school.edu', role: 'guide' };
    const pendingKey = 'class-123:teacher@school.edu';

    beforeEach(() => {
      mockVerifyToken.mockReturnValue(validUser);
      
      // Mock global pending acceptances
      const mockPending = new Map();
      mockPending.set(pendingKey, {
        classId: 'class-123',
        email: 'teacher@school.edu',
        role: 'co_teacher' as const,
        acceptedAt: Date.now()
      });
      
      (global as any).pendingInviteAcceptances = mockPending;
    });

    it('should process pending acceptance successfully', async () => {
      mockGetClassCollaborators.mockReturnValue({
        success: true,
        collaborators: []
      });
      
      mockAddCollaborator.mockReturnValue({
        success: true
      });

      const response = await request(app)
        .post('/api/invite/process-pending')
        .set('Authorization', 'Bearer valid-token')
        .send({ key: pendingKey });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collaborator.email).toBe('teacher@school.edu');
      expect(mockAddCollaborator).toHaveBeenCalledWith(
        validUser.email,
        'class-123',
        'teacher@school.edu',
        'co_teacher'
      );
    });

    it('should reject processing if not class owner', async () => {
      mockGetClassCollaborators.mockReturnValue({
        success: false,
        error: 'Not authorized'
      });

      const response = await request(app)
        .post('/api/invite/process-pending')
        .set('Authorization', 'Bearer valid-token')
        .send({ key: pendingKey });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('authorized');
    });

    it('should reject processing if key not found', async () => {
      const response = await request(app)
        .post('/api/invite/process-pending')
        .set('Authorization', 'Bearer valid-token')
        .send({ key: 'nonexistent-key' });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });
});