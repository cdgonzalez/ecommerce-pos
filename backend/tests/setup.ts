import { beforeEach, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-32-chars-minimum-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-32-chars-minimum-key';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

beforeEach(() => {
  vi.clearAllMocks();
});

