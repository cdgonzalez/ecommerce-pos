import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { LoginDTO, RegisterDTO } from './auth.schema';
import { auditService, AuditActions } from '../audit/audit.service';

export class AuthService {
  private generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { id: userId }, 
      process.env.JWT_ACCESS_SECRET!, 
      { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'] }
    );
    
    const refreshToken = jwt.sign(
      { id: userId, jti: uuidv4() }, 
      process.env.JWT_REFRESH_SECRET!, 
      { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'] }
    );

    return { accessToken, refreshToken };
  }

  async register(data: RegisterDTO) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name
      }
    });

    const { accessToken, refreshToken } = this.generateTokens(user.id);

    // Save refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken
    };
  }

  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({ 
      where: { email: data.email },
      include: { roles: { include: { role: true} } } 
    });
    
    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials or inactive account', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = this.generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Extraer nombres de roles en un arreglo simple de strings
    const userRoles = user.roles.map(ur => ur.role.name);

    return {
      user: { id: user.id, email: user.email, name: user.name, roles: userRoles },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    let decoded: { id: string };
    try {
      decoded = jwt.verify(
        incomingRefreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as { id: string };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive account', 401);
    }

    // Refresh Token Rotation (RTR) & Theft / Reuse Detection
    if (!user.refreshToken || user.refreshToken !== incomingRefreshToken) {
      // Reuso detectado: token ya reemplazado o revocado previamente.
      // Revocación inmediata de la sesión en base de datos.
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null }
      });

      await auditService.logAction({
        userId: user.id,
        action: AuditActions.TOKEN_REUSE_DETECTED,
        entity: 'Auth',
        entityId: user.id,
        metadata: {
          warning: 'Refresh token reuse detected. Active sessions revoked.',
          attemptedTokenFragment: incomingRefreshToken.substring(0, 15)
        }
      });

      throw new AppError('Token reuse detected. All active sessions have been revoked for security.', 401);
    }

    // Renovación válida con rotación
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });

    await auditService.logAction({
      userId: user.id,
      action: AuditActions.TOKEN_REFRESH,
      entity: 'Auth',
      entityId: user.id,
      metadata: { renewedAt: new Date().toISOString() }
    });

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(userId?: string, incomingRefreshToken?: string) {
    let targetUserId = userId;

    if (!targetUserId && incomingRefreshToken) {
      try {
        const decoded = jwt.verify(
          incomingRefreshToken,
          process.env.JWT_REFRESH_SECRET!
        ) as { id: string };
        targetUserId = decoded.id;
      } catch {
        // Si el token es inválido, continúa sin error
      }
    }

    if (targetUserId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { refreshToken: null }
      });

      await auditService.logAction({
        userId: targetUserId,
        action: AuditActions.USER_LOGOUT,
        entity: 'Auth',
        entityId: targetUserId,
        metadata: { loggedOutAt: new Date().toISOString() }
      });
    }

    return { message: 'Logged out successfully' };
  }
}
