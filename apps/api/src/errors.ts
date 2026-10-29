import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function send(response: Response, status: number, body: ErrorBody): void {
  response.status(status).json(body);
}

export function notFoundHandler(_request: Request, response: Response): void {
  send(response, 404, {
    error: { code: 'NOT_FOUND', message: 'The requested resource does not exist' },
  });
}

/**
 * Single error boundary. Internal details and stack traces never reach the
 * client: they are logged server side instead (API-005).
 */
export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    send(response, error.status, {
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  if (error instanceof ZodError) {
    send(response, 400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body or parameters are invalid',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  const httpError = error as { type?: string; status?: number };

  if (httpError.type === 'entity.parse.failed') {
    send(response, 400, {
      error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' },
    });
    return;
  }

  if (httpError.type === 'entity.too.large') {
    send(response, 413, {
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
    });
    return;
  }

  console.error('[api] unhandled error:', error);
  send(response, 500, {
    error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
  });
}
