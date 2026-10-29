import { Router } from 'express';
import { resetDatabase } from './seed';

/**
 * Test-only endpoints. Mounted only when ALLOW_TEST_ROUTES=1, which the
 * Playwright webServer and CI set explicitly.
 */
export const testRoutes = Router();

testRoutes.post('/reset', (_request, response) => {
  resetDatabase();
  response.json({ ok: true });
});

/**
 * Fault injection for API-005: the handler throws, the error boundary must
 * answer with a generic 500 and leave no stack trace in the response.
 */
testRoutes.get('/boom', () => {
  throw new Error('Simulated downstream dependency failure');
});
