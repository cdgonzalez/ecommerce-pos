import jwt, { SignOptions } from 'jsonwebtoken';

export function generateTestAccessToken(userId: string = 'test-user-uuid', expiresIn: string = '15m'): string {
  const secret = process.env.JWT_ACCESS_SECRET || 'test-jwt-access-secret-32-chars-minimum-key';
  return jwt.sign({ id: userId }, secret, { expiresIn: expiresIn as SignOptions['expiresIn'] });
}

export function createAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

