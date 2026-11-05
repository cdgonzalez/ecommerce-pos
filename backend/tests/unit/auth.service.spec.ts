import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../src/core/database/prisma.client';
import { AuthService } from '../../src/modules/auth/auth.service';
import { AppError } from '../../src/core/utils/AppError';
import { auditService, AuditActions } from '../../src/modules/audit/audit.service';

vi.mock('../../src/core/database/prisma.client', () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

vi.mock('../../src/modules/audit/audit.service', () => {
  return {
    AuditActions: {
      TOKEN_REFRESH: 'TOKEN_REFRESH',
      TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
      USER_LOGOUT: 'USER_LOGOUT',
    },
    auditService: {
      logAction: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('AuthService Unit Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should throw AppError 409 if user email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'existing-id',
        email: 'test@example.com',
      } as any);

      await expect(
        authService.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(AppError);
    });

    it('should successfully register a user with hashed password and return tokens', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user-id',
        email: 'newuser@example.com',
        name: 'New User',
        password: 'hashed-password',
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const result = await authService.register({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('newuser@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalledOnce();
      expect(prisma.user.update).toHaveBeenCalledOnce(); // saves refresh token
    });
  });

  describe('login', () => {
    it('should throw AppError 401 if user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      await expect(
        authService.login({ email: 'unknown@example.com', password: 'Password123!' })
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError 401 if account is inactive', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'inactive-user',
        email: 'inactive@example.com',
        isActive: false,
      } as any);

      await expect(
        authService.login({ email: 'inactive@example.com', password: 'Password123!' })
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError 401 if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-id',
        email: 'user@example.com',
        password: hashedPassword,
        isActive: true,
        roles: [],
      } as any);

      await expect(
        authService.login({ email: 'user@example.com', password: 'WrongPassword!' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should login successfully with correct password and return user with roles', async () => {
      const password = 'CorrectPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-id',
        email: 'user@example.com',
        name: 'John Doe',
        password: hashedPassword,
        isActive: true,
        roles: [{ role: { name: 'ADMIN' } }],
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const result = await authService.login({ email: 'user@example.com', password });

      expect(result.user.email).toBe('user@example.com');
      expect(result.user.roles).toContain('ADMIN');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('refreshToken (US1, US2, US4)', () => {
    it('should throw 400 if incoming token is empty or missing', async () => {
      await expect(authService.refreshToken('')).rejects.toThrow('Refresh token is required');
    });

    it('should throw 401 if incoming token signature is invalid', async () => {
      await expect(authService.refreshToken('invalid-jwt-signature')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw 401 if user does not exist or is inactive (US4)', async () => {
      const validToken = jwt.sign({ id: 'user-inactive', jti: 'init-1' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-inactive',
        isActive: false,
        refreshToken: validToken,
      } as any);

      await expect(authService.refreshToken(validToken)).rejects.toThrow(
        'User not found or inactive account'
      );
    });

    it('should detect token reuse, revoke all sessions and log audit alert (US2)', async () => {
      const oldToken = jwt.sign({ id: 'user-reuse', jti: 'token-old' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });
      const currentToken = jwt.sign({ id: 'user-reuse', jti: 'token-current' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-reuse',
        isActive: true,
        refreshToken: currentToken, // DB has currentToken, but oldToken was presented
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      await expect(authService.refreshToken(oldToken)).rejects.toThrow(
        /Token reuse detected/i
      );

      // Verify DB revoked the active token
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-reuse' },
        data: { refreshToken: null },
      });

      // Verify security audit log was written
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-reuse',
          action: AuditActions.TOKEN_REUSE_DETECTED,
        })
      );
    });

    it('should successfully rotate tokens on valid refresh and log audit event (US1, US2)', async () => {
      const validToken = jwt.sign({ id: 'user-valid', jti: 'token-valid' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-valid',
        isActive: true,
        refreshToken: validToken,
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const result = await authService.refreshToken(validToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(validToken); // Rotated!

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-valid' },
        data: { refreshToken: result.refreshToken },
      });

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-valid',
          action: AuditActions.TOKEN_REFRESH,
        })
      );
    });
  });

  describe('logout (US3)', () => {
    it('should nullify refreshToken in database and record USER_LOGOUT audit event by userId', async () => {
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const response = await authService.logout('user-logout-id');

      expect(response.message).toMatch(/logged out successfully/i);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-logout-id' },
        data: { refreshToken: null },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-logout-id',
          action: AuditActions.USER_LOGOUT,
        })
      );
    });

    it('should nullify refreshToken in database by token if userId is missing', async () => {
      const token = jwt.sign({ id: 'decoded-user-id', jti: 'token-logout' }, process.env.JWT_REFRESH_SECRET!, {
        expiresIn: '7d',
      });
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const response = await authService.logout(undefined, token);

      expect(response.message).toMatch(/logged out successfully/i);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'decoded-user-id' },
        data: { refreshToken: null },
      });
    });
  });
});
