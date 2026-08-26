export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BOOKING_CONFLICT'
  | 'BOOKING_NOT_FOUND'
  | 'BOOKING_NOT_CANCELLABLE'
  | 'FORBIDDEN'
  | 'ROOM_NOT_FOUND'
  | 'OFFICE_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'START_NOT_IN_FUTURE'
  | 'BOOKING_TOO_FAR_AHEAD'
  | 'DURATION_TOO_SHORT'
  | 'TIME_NOT_ALIGNED'
  | 'OUTSIDE_WORKING_HOURS'
  | 'END_BEFORE_START'
  | 'INVALID_DATE'
  | 'INVALID_DATE_RANGE'
  | 'TITLE_REQUIRED'
  | 'WEBSOCKET_UPGRADE_REQUIRED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly status: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.error.code;
    if (body.error.details !== undefined) {
      this.details = body.error.details;
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
