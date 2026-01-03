// ============================================================================
// Custom Error Classes with HTTP Status Codes
// ============================================================================

/**
 * Base API error with HTTP status code
 */
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 401 Unauthorized - Authentication required or invalid
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

/**
 * 403 Forbidden - Authenticated but lacks permission
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

/**
 * 400 Bad Request - Invalid input or validation failure
 */
export class ValidationError extends ApiError {
  constructor(message: string = "Invalid request") {
    super(message, 400);
    this.name = "ValidationError";
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends ApiError {
  constructor(message: string = "Not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/**
 * 409 Conflict - Resource already exists or conflicts
 */
export class ConflictError extends ApiError {
  constructor(message: string = "Conflict") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

// ============================================================================
// Error Handler
// ============================================================================

/**
 * Handle errors in API routes and return appropriate Response
 */
export function handleApiError(error: unknown): Response {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.statusCode });
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return Response.json({ error: message }, { status: 500 });
}
