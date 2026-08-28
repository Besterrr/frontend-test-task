import { describe, expect, it, vi } from 'vitest';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './client';
import { ApiError, type ApiErrorBody } from './errors';

vi.mock('../lib/env', () => ({
  env: {
    apiBaseUrl: 'https://api.test.com',
  },
}));

const getResponseInterceptor = () => {
  const handlers = apiClient.interceptors.response.handlers;
  return handlers?.[0]?.fulfilled;
};

const getErrorInterceptor = () => {
  const handlers = apiClient.interceptors.response.handlers;
  return handlers?.[0]?.rejected;
};

const createAxiosError = <T>(
  errorBody: T | undefined,
  status: number,
  hasResponse = true,
): AxiosError<T> => {
  return new AxiosError<T>(
    'Request failed',
    String(status),
    {} as InternalAxiosRequestConfig,
    {},
    hasResponse
      ? {
          data: errorBody as T,
          status,
          statusText: 'Error',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        }
      : undefined,
  );
};

const testErrorInterceptor = async <T>(
  errorBody: T | undefined,
  status: number,
  expectedError?: { status: number; code: string; message?: string },
  hasResponse = true,
) => {
  const mockError = createAxiosError(errorBody, status, hasResponse);
  const interceptor = getErrorInterceptor();
  expect(interceptor).toBeDefined();

  if (interceptor) {
    try {
      await interceptor(mockError);
      expect(true).toBe(false);
    } catch (error) {
      if (expectedError) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(expectedError.status);
          expect(error.code).toBe(expectedError.code);
          if (expectedError.message) {
            expect(error.message).toBe(expectedError.message);
          }
        }
      } else {
        expect(error).toBe(mockError);
        expect(error).not.toBeInstanceOf(ApiError);
      }
    }
  }
};

describe('apiClient', () => {
  describe('конфигурация', () => {
    it('использует правильный baseURL из env', () => {
      expect(apiClient.defaults.baseURL).toBe('https://api.test.com');
    });

    it('имеет правильные заголовки', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('интерцептор ответов', () => {
    it('пропускает успешные ответы', async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      const interceptor = getResponseInterceptor();
      expect(interceptor).toBeDefined();

      if (interceptor) {
        const result = await interceptor(mockResponse);
        expect(result).toBe(mockResponse);
        expect(result.data).toEqual({ success: true });
      }
    });

    it('преобразует ошибку с ApiErrorBody в ApiError', async () => {
      const errorBody: ApiErrorBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации',
          details: { field: 'title' },
        },
      };

      await testErrorInterceptor(errorBody, 400, {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Ошибка валидации',
      });
    });

    it('пропускает сетевую ошибку без объекта response', async () => {
      await testErrorInterceptor(undefined, 0, undefined, false);
    });

    it('пропускает ошибки без data в ответе', async () => {
      await testErrorInterceptor(undefined, 500);
    });

    it('пропускает ошибки с неправильным форматом тела (нет поля error)', async () => {
      const errorBody = { message: 'Ошибка' };
      await testErrorInterceptor(errorBody, 400);
    });

    const errorCodes = [
      { status: 400, code: 'VALIDATION_ERROR' },
      { status: 404, code: 'BOOKING_NOT_FOUND' },
      { status: 403, code: 'FORBIDDEN' },
      { status: 409, code: 'BOOKING_CONFLICT' },
      { status: 500, code: 'INTERNAL_ERROR' },
    ];

    errorCodes.forEach(({ status, code }) => {
      it(`преобразует ${status} ${code} в ApiError`, async () => {
        const errorBody: ApiErrorBody = {
          error: {
            code,
            message: `Error: ${code}`,
          },
        };

        await testErrorInterceptor(errorBody, status, {
          status,
          code,
        });
      });
    });
  });

  describe('формирование URL', () => {
    it('создает запрос с правильным URL', () => {
      const requestConfig = apiClient.getUri({
        url: '/bookings',
        method: 'GET',
      });

      expect(requestConfig).toBe('https://api.test.com/bookings');
    });

    it('создает запрос с параметрами', () => {
      const requestConfig = apiClient.getUri({
        url: '/bookings',
        method: 'GET',
        params: { scope: 'upcoming', officeId: 'office-1' },
      });

      expect(requestConfig).toContain('https://api.test.com/bookings');
      expect(requestConfig).toContain('scope=upcoming');
      expect(requestConfig).toContain('officeId=office-1');
    });
  });
});
