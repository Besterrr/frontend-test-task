import axios, { AxiosError } from 'axios';
import { ApiError, type ApiErrorBody } from './errors';
import { env } from '../lib/env';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.data && 'error' in error.response.data) {
      throw new ApiError(error.response.status, error.response.data);
    }
    throw error;
  },
);
