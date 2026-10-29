import { Router } from 'express';
import { z } from 'zod';
import {
  createSession,
  currentUser,
  destroySession,
  findUserByEmail,
  requireAuth,
  verifyPassword,
} from '../auth';
import { ApiError } from '../errors';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.email('A valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

authRouter.post('/login', (request, response) => {
  const body = loginSchema.parse(request.body);
  const user = findUserByEmail(body.email.trim().toLowerCase());

  // Same response for an unknown email and a wrong password: the API must not
  // reveal whether an account exists (AUTH-002).
  if (!user || !verifyPassword(body.password, user.password_hash)) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }

  const token = createSession(user.id);
  response.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

authRouter.post('/logout', requireAuth, (request, response) => {
  if (request.sessionToken) destroySession(request.sessionToken);
  response.status(204).end();
});

authRouter.get('/me', requireAuth, (request, response) => {
  response.json(currentUser(request));
});
