import { apiClient } from './client';
import type { User } from './models';

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/api/v1/me');
  return data;
}
