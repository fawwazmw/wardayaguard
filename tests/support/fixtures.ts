import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { ApiClient } from './api-client';
import { TEST_USERS, type TestUser } from '../fixtures/test-users';

async function resetState(request: APIRequestContext): Promise<void> {
  const response = await request.post('/api/test/reset');
  expect(response.status(), 'test reset endpoint must be reachable (ALLOW_TEST_ROUTES=1)').toBe(
    200,
  );
}

interface GuardFixtures {
  /** Auto fixture: every test starts from the deterministic seed. */
  resetDb: void;
  /** Unauthenticated client. */
  api: ApiClient;
  /** Client already logged in as the standard customer. */
  standard: ApiClient;
  /** A second customer, used for authorization tests. */
  rival: ApiClient;
}

async function loggedIn(request: APIRequestContext, user: TestUser): Promise<ApiClient> {
  const client = new ApiClient(request);
  await client.loginAs(user);
  return client;
}

export const test = base.extend<GuardFixtures>({
  resetDb: [
    async ({ request }, use) => {
      await resetState(request);
      await use();
    },
    { auto: true },
  ],

  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  standard: async ({ request, resetDb: _resetDb }, use) => {
    await use(await loggedIn(request, TEST_USERS.standard));
  },

  rival: async ({ request, resetDb: _resetDb }, use) => {
    await use(await loggedIn(request, TEST_USERS.rival));
  },
});

export { expect };
