import { apiClient } from './client';
import type { BookingView, RoomSummary } from './models';

export interface RoomsQuery {
  officeId: string;
  minCapacity?: number;
  from?: string;
  to?: string;
}

export async function fetchRooms(query: RoomsQuery): Promise<RoomSummary[]> {
  const { data } = await apiClient.get<{ items: RoomSummary[] }>('/api/v1/rooms', {
    params: {
      officeId: query.officeId,
      minCapacity: query.minCapacity,
      from: query.from,
      to: query.to,
    },
  });
  return data.items;
}

export async function fetchRoom(roomId: string): Promise<RoomSummary> {
  const { data } = await apiClient.get<RoomSummary>(`/api/v1/rooms/${roomId}`);
  return data;
}

export interface RoomScheduleQuery {
  roomId: string;
  from: string;
  to: string;
}

export async function fetchRoomSchedule(query: RoomScheduleQuery): Promise<BookingView[]> {
  const { data } = await apiClient.get<{ items: BookingView[] }>(
    `/api/v1/rooms/${query.roomId}/bookings`,
    { params: { from: query.from, to: query.to } },
  );
  return data.items;
}
