import { apiClient } from './client';
import type { Office } from './models';

export async function fetchOffices(): Promise<Office[]> {
  const { data } = await apiClient.get<{ items: Office[] }>('/api/v1/offices');
  return data.items;
}
