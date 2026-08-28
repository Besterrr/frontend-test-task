import { describe, expect, it, vi } from 'vitest';
import {
  isNetworkError,
  getErrorMessage,
  onGlobalError,
  notifyErrorGlobal,
} from './errorNotifications';
import { ApiError } from '../api/errors';

describe('isNetworkError', () => {
  it('возвращает true для ошибки axios ERR_NETWORK', () => {
    expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
  });

  it('возвращает true для message "Network Error"', () => {
    expect(isNetworkError(new Error('Network Error'))).toBe(true);
  });

  it('возвращает false для ApiError', () => {
    const error = new ApiError(400, { error: { code: 'VALIDATION_ERROR', message: 'test' } });
    expect(isNetworkError(error)).toBe(false);
  });

  it('возвращает false для произвольной ошибки', () => {
    expect(isNetworkError(new Error('что-то другое'))).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('возвращает сообщение о сети для сетевой ошибки', () => {
    expect(getErrorMessage({ code: 'ERR_NETWORK' })).toBe(
      'Не удалось соединиться с сервером. Проверьте подключение к интернету',
    );
  });

  it('возвращает message из ApiError', () => {
    const error = new ApiError(404, {
      error: { code: 'ROOM_NOT_FOUND', message: 'Комната не найдена' },
    });
    expect(getErrorMessage(error)).toBe('Комната не найдена');
  });

  it('возвращает дефолтное сообщение для неизвестной ошибки', () => {
    expect(getErrorMessage('строка вместо ошибки')).toBe('Произошла непредвиденная ошибка');
  });
});

describe('onGlobalError / notifyErrorGlobal', () => {
  it('вызывает подписчиков с сообщением об ошибке', () => {
    const listener = vi.fn();
    const unsubscribe = onGlobalError(listener);

    notifyErrorGlobal(new Error('Network Error'));

    expect(listener).toHaveBeenCalledWith(
      'Не удалось соединиться с сервером. Проверьте подключение к интернету',
    );
    unsubscribe();
  });

  it('перестаёт вызывать подписчика после unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = onGlobalError(listener);
    unsubscribe();

    notifyErrorGlobal(new Error('Network Error'));

    expect(listener).not.toHaveBeenCalled();
  });
});
