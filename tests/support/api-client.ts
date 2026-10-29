import { expect, type APIRequestContext } from '@playwright/test';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface ApiResult<T = unknown> {
  status: number;
  body: T;
}

interface SendOptions {
  data?: unknown;
  headers?: Record<string, string>;
}

/**
 * Thin typed wrapper over Playwright's APIRequestContext.
 * Keeps bearer-token handling in one place so specs read as intent.
 */
export class ApiClient {
  token: string | null = null;

  constructor(private readonly request: APIRequestContext) {}

  private async send<T>(
    method: Method,
    path: string,
    options: SendOptions = {},
  ): Promise<ApiResult<T>> {
    const headers: Record<string, string> = { ...options.headers };
    if (this.token) headers.authorization = `Bearer ${this.token}`;

    const requestOptions: Parameters<APIRequestContext['fetch']>[1] = {
      method,
      headers,
      failOnStatusCode: false,
    };
    if (options.data !== undefined) requestOptions.data = options.data;

    const response = await this.request.fetch(path, requestOptions);
    const text = await response.text();

    let body: unknown = null;
    if (text.length > 0) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    return { status: response.status(), body: body as T };
  }

  get<T = unknown>(path: string): Promise<ApiResult<T>> {
    return this.send<T>('GET', path);
  }

  post<T = unknown>(
    path: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResult<T>> {
    return this.send<T>('POST', path, { data, headers });
  }

  patch<T = unknown>(path: string, data?: unknown): Promise<ApiResult<T>> {
    return this.send<T>('PATCH', path, { data });
  }

  delete<T = unknown>(path: string): Promise<ApiResult<T>> {
    return this.send<T>('DELETE', path);
  }

  async login(
    email: string,
    password: string,
  ): Promise<ApiResult<{ token: string; user: { id: number; email: string; name: string } }>> {
    const result = await this.post<{
      token: string;
      user: { id: number; email: string; name: string };
    }>('/api/auth/login', { email, password });

    if (result.status === 200) this.token = result.body.token;
    return result;
  }

  async loginAs(user: { email: string; password: string }): Promise<this> {
    const result = await this.login(user.email, user.password);
    expect(result.status, `login failed for ${user.email}`).toBe(200);
    return this;
  }
}
