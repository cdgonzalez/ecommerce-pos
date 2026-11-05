import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import prisma from '../../src/core/database/prisma.client';

vi.mock('../../src/core/database/prisma.client', () => {
  return {
    default: {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    },
  };
});

vi.mock('../../src/core/cache/redis.client', () => {
  return {
    default: {
      isOpen: false,
      get: vi.fn().mockResolvedValue(null),
      setEx: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      keys: vi.fn().mockResolvedValue([]),
    },
  };
});

describe('Auth API Integration Tests (Supertest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 400 when required fields are missing in body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'incomplete@example.com' }); // missing password and name

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('should return 201 with tokens when registration is valid', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'hashed-password',
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('jane@example.com');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 409 when email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'existing-id',
        email: 'duplicate@example.com',
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'duplicate@example.com',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/already registered/i);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 401 when invalid credentials are provided', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    it('should return 200 with user data and tokens on successful login', async () => {
      const password = 'CorrectPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'valid-user-id',
        name: 'Valid User',
        email: 'valid@example.com',
        password: hashedPassword,
        isActive: true,
        roles: [{ role: { name: 'CASHIER' } }],
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'valid@example.com',
          password,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.roles).toContain('CASHIER');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/refresh-token (US1, US2, US4)', () => {
    it('should return 400 if refreshToken is missing in payload', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/refreshToken/i);
    });

    it('should return 401 if refreshToken is invalid or has bad signature', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: 'malformed.invalid.token' });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Invalid or expired refresh token/i);
    });

    it('should return 401 if account is deactivated (US4)', async () => {
      const token = jwt.sign({ id: 'inactive-account', jti: 'init-inact' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'inactive-account',
        isActive: false,
        refreshToken: token,
      } as any);

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: token });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/inactive account/i);
    });

    it('should return 401 and revoke active session if token reuse is detected (US2)', async () => {
      const oldToken = jwt.sign({ id: 'user-stolen', jti: 'old-jti' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });
      const currentToken = jwt.sign({ id: 'user-stolen', jti: 'current-jti' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-stolen',
        isActive: true,
        refreshToken: currentToken, // Mismatch with oldToken
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: oldToken });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Token reuse detected/i);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-stolen' },
        data: { refreshToken: null },
      });
    });

    it('should return 200 with new rotated token pair when valid (US1, US2)', async () => {
      const validToken = jwt.sign({ id: 'user-rotate', jti: 'rotate-jti' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-rotate',
        isActive: true,
        refreshToken: validToken,
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: validToken });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken).not.toBe(validToken);
    });
  });

  describe('POST /api/v1/auth/logout (US3)', () => {
    it('should return 200 and clear refresh token in database', async () => {
      const accessToken = jwt.sign({ id: 'logged-in-user' }, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: '15m',
      });

      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.message).toMatch(/logged out successfully/i);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'logged-in-user' },
        data: { refreshToken: null },
      });
    });

    it('should return 200 and clear refresh token via body refreshToken if access token not provided', async () => {
      const refreshToken = jwt.sign({ id: 'expired-access-user', jti: 'logout-jti' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });

      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'expired-access-user' },
        data: { refreshToken: null },
      });
    });
  });
});
