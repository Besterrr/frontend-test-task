import { apiClient } from './client';
import type { BookingsScope, BookingView } from './models';

export interface MyBookingsQuery {
  scope?: BookingsScope;
  officeId?: string;
}

export async function fetchMyBookings(query: MyBookingsQuery = {}): Promise<BookingView[]> {
  const { data } = await apiClient.get<{ items: BookingView[] }>('/api/v1/bookings', {
    params: { scope: query.scope, officeId: query.officeId },
  });
  return data.items;
}

export interface CreateBookingInput {
  roomId: string;
  title: string;
  comment?: string | null;
  startsAt: string;
  endsAt: string;
}

export async function createBooking(input: CreateBookingInput): Promise<BookingView> {
  const { data } = await apiClient.post<BookingView>('/api/v1/bookings', input);
  return data;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await apiClient.delete(`/api/v1/bookings/${bookingId}`);
}
