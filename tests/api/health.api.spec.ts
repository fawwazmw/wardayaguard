import { expect, test } from '../support/fixtures';
import type { ErrorBody } from '../support/types';

test.describe('API health and routing', () => {
  test('health reports the API and database are up', async ({ api }) => {
    const response = await api.get<{ status: string; service: string; database: string }>(
      '/api/health',
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'wardaya-api',
      database: 'ok',
    });
  });

  test('an unknown route returns a structured 404, not HTML', async ({ api }) => {
    const response = await api.get<ErrorBody>('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('API-005 a server fault returns a generic 500 with no stack trace', async ({ api }) => {
    const response = await api.get<ErrorBody>('/api/test/boom');
    const raw = JSON.stringify(response.body);

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.body.error.message).toBe('Unexpected server error');
    expect(raw).not.toContain('Simulated downstream dependency failure');
    expect(raw).not.toMatch(/\bat\s+\S+\s+\(/);
  });
});
