import { TEST_USERS } from '../fixtures/test-users';
import { expect, test } from '../support/fixtures';
import type { ErrorBody } from '../support/types';

test.describe('authentication and sessions', () => {
  test('AUTH-001 valid credentials return a session token and the account', async ({ api }) => {
    const response = await api.login(TEST_USERS.standard.email, TEST_USERS.standard.password);

    expect(response.status).toBe(200);
    expect(response.body.token).toMatch(/^[a-f0-9]{64}$/);
    expect(response.body.user).toMatchObject({
      id: TEST_USERS.standard.id,
      email: TEST_USERS.standard.email,
      name: TEST_USERS.standard.name,
    });
    expect(JSON.stringify(response.body)).not.toContain('password');
  });

  test('AUTH-002 a wrong password and an unknown email are indistinguishable', async ({ api }) => {
    const wrongPassword = await api.post<ErrorBody>('/api/auth/login', {
      email: TEST_USERS.standard.email,
      password: 'not-the-password',
    });
    const unknownEmail = await api.post<ErrorBody>('/api/auth/login', {
      email: 'nobody@wardaya.test',
      password: TEST_USERS.standard.password,
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('AUTH-003 empty credentials are rejected before any lookup', async ({ api }) => {
    const response = await api.post<ErrorBody>('/api/auth/login', { email: '', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('AUTH-004 protected routes reject a missing token', async ({ api }) => {
    for (const path of ['/api/cart', '/api/orders', '/api/auth/me']) {
      const response = await api.get<ErrorBody>(path);
      expect(response.status, `${path} should require authentication`).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    }
  });

  test('AUTH-004 a forged token is rejected', async ({ api }) => {
    api.token = 'f'.repeat(64);
    const response = await api.get<ErrorBody>('/api/orders');

    expect(response.status).toBe(401);
  });

  test('AUTH-005 logout invalidates the session for the same token', async ({ standard }) => {
    const before = await standard.get('/api/auth/me');
    const logout = await standard.post('/api/auth/logout');
    const after = await standard.get<ErrorBody>('/api/auth/me');

    expect(before.status).toBe(200);
    expect(logout.status).toBe(204);
    expect(after.status).toBe(401);
    expect(after.body.error.code).toBe('UNAUTHORIZED');
  });

  test('AUTH-005 logout does not invalidate other sessions of the same account', async ({
    standard,
    api,
  }) => {
    // api is a separate client, so it holds a second session for the same user.
    const second = await api.login(TEST_USERS.standard.email, TEST_USERS.standard.password);
    expect(second.status).toBe(200);

    await standard.post('/api/auth/logout');

    const otherSession = await api.get('/api/auth/me');
    expect(otherSession.status).toBe(200);
  });

  test('API-003 malformed JSON returns a controlled validation error', async ({ api }) => {
    const response = await api.post<ErrorBody>('/api/auth/login', '{"email":', {
      'content-type': 'application/json',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('SyntaxError');
  });
});
