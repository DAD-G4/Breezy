import { Response } from 'express';

// ── Response shapes ──────────────────────────────────────────────────────────

export interface SuccessResponse<T = any> {
  data: T;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  statusCode: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Send a success response.
 *
 * @param res     Express Response object
 * @param data    Payload to return
 * @param message Optional human-readable message
 * @param statusCode HTTP status code (default 200)
 */
export function success<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response<SuccessResponse<T>> {
  const body: SuccessResponse<T> = { data };
  if (message) {
    body.message = message;
  }
  return res.status(statusCode).json(body);
}

/**
 * Send an error response.
 *
 * @param res        Express Response object
 * @param error      Error message
 * @param statusCode HTTP status code (default 500)
 */
export function error(
  res: Response,
  errorMessage: string,
  statusCode: number = 500
): Response<ErrorResponse> {
  return res.status(statusCode).json({ error: errorMessage, statusCode });
}
