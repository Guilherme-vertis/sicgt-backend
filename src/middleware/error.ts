import type { ErrorRequestHandler, RequestHandler } from 'express';
import { validationResult } from 'express-validator';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const validate: RequestHandler = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(422, errors.array().map(e => e.msg).join('; ')));
  }
  next();
};

export const notFound: RequestHandler = (_req, _res, next) =>
  next(new ApiError(404, 'Endpoint não encontrado'));

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  const status = error instanceof ApiError ? error.status : 500;
  res.status(status).json({
    error: status === 500 ? 'Erro interno do servidor' : error.message,
  });
};

export const asyncHandler = (fn: RequestHandler): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
