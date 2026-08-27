import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RealtimeClient } from './realtimeClient';

type Listener = (event: unknown) => void;

class MockSocket {
  listeners: Record<string, Listener[]> = {};
  closed = false;

  addEventListener(type: string, listener: Listener) {
    (this.listeners[type] ??= []).push(listener);
  }

  close() {
    this.closed = true;
    this.dispatch('close', {});
  }

  dispatch(type: string, event: unknown) {
    this.listeners[type]?.forEach((listener) => listener(event));
  }
}

let lastSocket: MockSocket;

vi.mock('reconnecting-websocket', () => ({
  default: vi.fn().mockImplementation(function MockReconnectingWebSocket() {
    lastSocket = new MockSocket();
    return lastSocket;
  }),
}));

describe('RealtimeClient', () => {
  let client: RealtimeClient;

  beforeEach(() => {
    client = new RealtimeClient();
  });

  it('переходит в статус connecting сразу после connect', () => {
    const statuses: string[] = [];
    client.onStatusChange((status) => statuses.push(status));
    client.connect('ws://test');
    expect(statuses).toContain('connecting');
  });

  it('переходит в connected при событии open', () => {
    const statuses: string[] = [];
    client.connect('ws://test');
    client.onStatusChange((status) => statuses.push(status));

    lastSocket.dispatch('open', {});

    expect(statuses.at(-1)).toBe('connected');
  });

  it('переходит в reconnecting при error', () => {
    const statuses: string[] = [];
    client.connect('ws://test');
    client.onStatusChange((status) => statuses.push(status));

    lastSocket.dispatch('error', {});

    expect(statuses.at(-1)).toBe('reconnecting');
  });

  it('переходит в disconnected при close без предшествующей ошибки', () => {
    const statuses: string[] = [];
    client.connect('ws://test');
    client.onStatusChange((status) => statuses.push(status));

    lastSocket.dispatch('close', {});

    expect(statuses.at(-1)).toBe('disconnected');
  });

  it('парсит и передаёт валидное событие подписчикам onEvent', () => {
    const received: unknown[] = [];
    client.connect('ws://test');
    client.onEvent((event) => received.push(event));

    const payload = {
      type: 'booking.created',
      occurredAt: '2026-08-18T09:00:00.000Z',
      data: { booking: { id: 'booking-1' } },
    };
    lastSocket.dispatch('message', { data: JSON.stringify(payload) });

    expect(received).toEqual([payload]);
  });

  it('игнорирует сообщение с невалидным JSON', () => {
    const received: unknown[] = [];
    client.connect('ws://test');
    client.onEvent((event) => received.push(event));

    lastSocket.dispatch('message', { data: '{не json' });

    expect(received).toHaveLength(0);
  });

  it('игнорирует сообщение без обязательных полей события', () => {
    const received: unknown[] = [];
    client.connect('ws://test');
    client.onEvent((event) => received.push(event));

    lastSocket.dispatch('message', { data: JSON.stringify({ foo: 'bar' }) });

    expect(received).toHaveLength(0);
  });

  it('unsubscribe прекращает получение событий', () => {
    const received: unknown[] = [];
    client.connect('ws://test');
    const unsubscribe = client.onEvent((event) => received.push(event));
    unsubscribe();

    const payload = {
      type: 'data.reset',
      occurredAt: '2026-08-18T09:00:00.000Z',
      data: {},
    };
    lastSocket.dispatch('message', { data: JSON.stringify(payload) });

    expect(received).toHaveLength(0);
  });

  it('disconnect закрывает сокет и переводит статус в disconnected', () => {
    client.connect('ws://test');
    lastSocket.dispatch('open', {});
    expect(client.getStatus()).toBe('connected');

    client.disconnect();

    expect(lastSocket.closed).toBe(true);
    expect(client.getStatus()).toBe('disconnected');
  });

  it('onStatusChange сразу вызывается с текущим статусом при подписке', () => {
    const statuses: string[] = [];
    client.onStatusChange((status) => statuses.push(status));
    expect(statuses).toEqual(['disconnected']);
  });
});
