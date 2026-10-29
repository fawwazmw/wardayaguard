import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { db, type UserRow } from './db';
import { ApiError } from './errors';

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !digest) return false;

  const expected = Buffer.from(digest, 'hex');
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  if (expected.length !== candidate.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function createSession(userId: number): string {
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

export function destroySession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
      sessionToken?: string;
    }
  }
}

export function bearerToken(request: Request): string | undefined {
  const header = request.get('authorization') ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) return undefined;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : undefined;
}

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  const token = bearerToken(request);
  if (!token) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }

  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token = ?`,
    )
    .get(token) as SessionUser | undefined;

  if (!row) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Session is invalid or expired'));
    return;
  }

  request.user = { id: row.id, email: row.email, name: row.name };
  request.sessionToken = token;
  next();
}

export function currentUser(request: Request): SessionUser {
  if (!request.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
  return request.user;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
}
