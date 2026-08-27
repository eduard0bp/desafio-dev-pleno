/**
 * Domain/HTTP errors a route can `throw` instead of building the response
 * envelope by hand at every call site — the error-handling middleware in
 * app.ts is what actually turns one of these into a response, so the
 * status/code/retryable/details shape only needs to be defined once.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, retryable = false, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.details = details;
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, false, details);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Recurso não encontrado') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, 'INVALID_STATE', message);
  }
}
