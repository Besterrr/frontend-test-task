import ReconnectingWebSocket from 'reconnecting-websocket';
import { env } from './env';

export type RealtimeEventType =
  'booking.created' | 'booking.cancelled' | 'room.availability_changed' | 'data.reset';

export interface BookingCreatedEvent {
  type: 'booking.created';
  occurredAt: string;
  data: { booking: Record<string, unknown> };
}

export interface BookingCancelledEvent {
  type: 'booking.cancelled';
  occurredAt: string;
  data: { booking: Record<string, unknown> };
}

export interface RoomAvailabilityChangedEvent {
  type: 'room.availability_changed';
  occurredAt: string;
  data: {
    roomId: string;
    officeId: string;
    startsAt: string;
    endsAt: string;
    available: boolean;
  };
}

export interface DataResetEvent {
  type: 'data.reset';
  occurredAt: string;
  data: Record<string, never>;
}

export type RealtimeEvent =
  BookingCreatedEvent | BookingCancelledEvent | RoomAvailabilityChangedEvent | DataResetEvent;

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type EventListener = (event: RealtimeEvent) => void;
type StatusListener = (status: ConnectionStatus) => void;

function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'occurredAt' in value &&
    'data' in value &&
    typeof (value as { type: unknown }).type === 'string'
  );
}

export class RealtimeClient {
  private socket: ReconnectingWebSocket | null = null;
  private readonly eventListeners = new Set<EventListener>();
  private readonly statusListeners = new Set<StatusListener>();
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempt = 0;

  connect(url: string = env.wsUrl): void {
    if (this.socket) return;

    this.setStatus('connecting');
    const socket = new ReconnectingWebSocket(url);
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.reconnectAttempt = 0;
      this.setStatus('connected');
    });

    socket.addEventListener('close', () => {
      this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'disconnected');
    });

    socket.addEventListener('error', () => {
      this.reconnectAttempt += 1;
      this.setStatus('reconnecting');
    });

    socket.addEventListener('message', (message: MessageEvent<string>) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.data);
      } catch {
        return;
      }
      if (!isRealtimeEvent(parsed)) return;
      for (const listener of this.eventListeners) {
        listener(parsed);
      }
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this.reconnectAttempt = 0;
    this.setStatus('disconnected');
  }

  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}

export const realtimeClient = new RealtimeClient();
