import { Response } from 'express';

export interface SuccessResponse<T = any> {
  data: T;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  statusCode: number;
}

export function success<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response<SuccessResponse<T>> {
  const body: SuccessResponse<T> = { data };
  if (message) {
    body.message = message;
  }
  return res.status(statusCode).json(body);
}

export function error(
  res: Response,
  errorMessage: string,
  statusCode = 500
): Response<ErrorResponse> {
  return res.status(statusCode).json({ error: errorMessage, statusCode });
}
