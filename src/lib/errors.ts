export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized: Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden: Insufficient permissions for this organization or resource") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource", identifier?: string) {
    super(
      identifier ? `${resource} '${identifier}' not found` : `${resource} not found`,
      404,
      "NOT_FOUND"
    );
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(fromState: string, toState: string, reason?: string) {
    super(
      `Invalid workspace state transition from '${fromState}' to '${toState}'${
        reason ? `: ${reason}` : ""
      }`,
      409,
      "INVALID_STATE_TRANSITION"
    );
    this.name = "InvalidStateTransitionError";
  }
}

export class SecurityViolationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(`Security policy violation: ${message}`, 400, "SECURITY_VIOLATION", details);
    this.name = "SecurityViolationError";
  }
}
