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
  // Données live : jamais mises en cache par le navigateur. Sans ça, Safari
  // mobile (cache heuristique sur les GET avec ETag) sert des réponses périmées
  // → l'app paraît figée tant qu'on ne recharge pas la page.
  res.setHeader('Cache-Control', 'no-store');
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
  res.setHeader('Cache-Control', 'no-store');
  return res.status(statusCode).json({ error: errorMessage, statusCode });
}
