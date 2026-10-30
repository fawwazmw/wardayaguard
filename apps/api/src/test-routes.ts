import { Router } from 'express';
import { armCheckoutFailure, resetFaults } from './faults';
import { resetDatabase } from './seed';

/**
 * Test-only endpoints. Mounted only when ALLOW_TEST_ROUTES=1, which the
 * Playwright webServer and CI set explicitly.
 */
export const testRoutes = Router();

testRoutes.post('/reset', (_request, response) => {
  resetFaults();
  resetDatabase();
  response.json({ ok: true });
});

/**
 * Arms a one-shot checkout failure. The next checkout returns 503 before any
 * order work, which lets the suite verify cart preservation and recovery.
 */
testRoutes.post('/fail-next-checkout', (_request, response) => {
  armCheckoutFailure();
  response.status(204).end();
});

/**
 * Fault injection for API-005: the handler throws, the error boundary must
 * answer with a generic 500 and leave no stack trace in the response.
 */
testRoutes.get('/boom', () => {
  throw new Error('Simulated downstream dependency failure');
});
