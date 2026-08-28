import { isApiError } from '../api/errors';

export function isNetworkError(error: unknown): boolean {
  if (isApiError(error)) return false;
  if (typeof error !== 'object' || error === null) return false;
  const err = error as { message?: string; code?: string };
  return err.code === 'ERR_NETWORK' || err.message === 'Network Error';
}

export function getErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Не удалось соединиться с сервером. Проверьте подключение к интернету';
  }
  if (isApiError(error)) {
    return error.message;
  }
  return 'Произошла непредвиденная ошибка';
}

type ErrorListener = (message: string) => void;

const listeners = new Set<ErrorListener>();

export function onGlobalError(listener: ErrorListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyErrorGlobal(error: unknown): void {
  const message = getErrorMessage(error);
  for (const listener of listeners) {
    listener(message);
  }
}
