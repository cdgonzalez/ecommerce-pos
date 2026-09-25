import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../../core/database/prisma.client';
import { AppError } from '../../core/utils/AppError';
import { LoginDTO, RegisterDTO } from './auth.schema';

export class AuthService {
  private generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { id: userId }, 
      process.env.JWT_ACCESS_SECRET!, 
      { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'] }
    );
    
    const refreshToken = jwt.sign(
      { id: userId }, 
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
}