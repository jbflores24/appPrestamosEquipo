import { HttpErrorResponse } from '@angular/common/http';
import { ValidationErrors } from './api.models';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: ValidationErrors,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static from(error: HttpErrorResponse): ApiError {
    const body = error.error;
    if (!body || typeof body !== 'object' || typeof body.message !== 'string') {
      return new ApiError(error.status, 'No se pudo conectar con el servidor');
    }
    return new ApiError(error.status, body.message, ApiError.fieldErrorsOf(error.status, body.data));
  }

  private static fieldErrorsOf(status: number, data: unknown): ValidationErrors | undefined {
    if (status !== 422 || !data || typeof data !== 'object' || Array.isArray(data)) {
      return undefined;
    }
    return data as ValidationErrors;
  }
}
