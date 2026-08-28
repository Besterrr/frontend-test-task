import { describe, expect, it } from 'vitest';
import { ApiError, isApiError, type ApiErrorBody, type ApiErrorCode } from './errors';

describe('ApiError', () => {
  describe('конструктор', () => {
    it('создает ошибку с правильными свойствами', () => {
      const status = 400;
      const body: ApiErrorBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Проверьте параметры запроса',
          details: { field: 'title', reason: 'required' },
        },
      };

      const error = new ApiError(status, body);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.name).toBe('ApiError');
      expect(error.status).toBe(status);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Проверьте параметры запроса');
      expect(error.details).toEqual({ field: 'title', reason: 'required' });
    });

    it('создает ошибку без details', () => {
      const status = 404;
      const body: ApiErrorBody = {
        error: {
          code: 'NOT_FOUND',
          message: 'Ресурс не найден',
        },
      };

      const error = new ApiError(status, body);

      expect(error.status).toBe(status);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Ресурс не найден');
      expect(error.details).toBeUndefined();
    });

    it('корректно обрабатывает все коды ошибок', () => {
      const errorCodes: ApiErrorCode[] = [
        'VALIDATION_ERROR',
        'BOOKING_CONFLICT',
        'BOOKING_NOT_FOUND',
        'BOOKING_NOT_CANCELLABLE',
        'FORBIDDEN',
        'ROOM_NOT_FOUND',
        'OFFICE_NOT_FOUND',
        'USER_NOT_FOUND',
        'START_NOT_IN_FUTURE',
        'BOOKING_TOO_FAR_AHEAD',
        'DURATION_TOO_SHORT',
        'TIME_NOT_ALIGNED',
        'OUTSIDE_WORKING_HOURS',
        'END_BEFORE_START',
        'INVALID_DATE',
        'INVALID_DATE_RANGE',
        'TITLE_REQUIRED',
        'WEBSOCKET_UPGRADE_REQUIRED',
        'NOT_FOUND',
        'INTERNAL_ERROR',
      ];

      errorCodes.forEach((code) => {
        const body: ApiErrorBody = {
          error: {
            code,
            message: `Error: ${code}`,
          },
        };

        const error = new ApiError(400, body);
        expect(error.code).toBe(code);
        expect(error.message).toBe(`Error: ${code}`);
      });
    });

    it('сохраняет стек ошибки', () => {
      const body: ApiErrorBody = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Внутренняя ошибка',
        },
      };

      const error = new ApiError(500, body);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
      expect(error.stack).toContain('ApiError');
    });

    it('корректно обрабатывает ошибку с вложенными details', () => {
      const body: ApiErrorBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации',
          details: {
            fields: {
              title: 'Обязательное поле',
              duration: 'Минимальная длительность 15 минут',
            },
          },
        },
      };

      const error = new ApiError(422, body);

      expect(error.details).toEqual({
        fields: {
          title: 'Обязательное поле',
          duration: 'Минимальная длительность 15 минут',
        },
      });
    });
  });

  describe('isApiError', () => {
    it('возвращает true для ApiError', () => {
      const body: ApiErrorBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации',
        },
      };

      const error = new ApiError(400, body);

      expect(isApiError(error)).toBe(true);
    });

    it('возвращает false для обычной ошибки', () => {
      const error = new Error('Обычная ошибка');
      expect(isApiError(error)).toBe(false);
    });

    it('возвращает false для null', () => {
      expect(isApiError(null)).toBe(false);
    });

    it('возвращает false для undefined', () => {
      expect(isApiError(undefined)).toBe(false);
    });

    it('возвращает false для объекта', () => {
      expect(isApiError({})).toBe(false);
    });

    it('возвращает false для строки', () => {
      expect(isApiError('ошибка')).toBe(false);
    });

    it('возвращает false для числа', () => {
      expect(isApiError(404)).toBe(false);
    });

    it('возвращает false для экземпляра Error, но не ApiError', () => {
      class CustomError extends Error {}
      const error = new CustomError('Custom error');
      expect(isApiError(error)).toBe(false);
    });
  });
});
