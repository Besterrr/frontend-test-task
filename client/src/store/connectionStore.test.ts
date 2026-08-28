import { describe, expect, it, beforeEach } from 'vitest';
import { useConnectionStore } from './connectionStore';
import type { ConnectionStatus } from '../lib/realtimeClient';

describe('useConnectionStore', () => {
  beforeEach(() => {
    useConnectionStore.setState({ status: 'disconnected' });
  });

  describe('начальное состояние', () => {
    it('имеет начальный статус "disconnected"', () => {
      const status = useConnectionStore.getState().status;
      expect(status).toBe('disconnected');
    });
  });

  describe('setStatus', () => {
    it('устанавливает статус "connecting"', () => {
      const { setStatus } = useConnectionStore.getState();

      setStatus('connecting');

      const status = useConnectionStore.getState().status;
      expect(status).toBe('connecting');
    });

    it('устанавливает статус "connected"', () => {
      const { setStatus } = useConnectionStore.getState();

      setStatus('connected');

      const status = useConnectionStore.getState().status;
      expect(status).toBe('connected');
    });

    it('устанавливает статус "disconnected"', () => {
      const { setStatus } = useConnectionStore.getState();

      setStatus('connected');
      expect(useConnectionStore.getState().status).toBe('connected');

      setStatus('disconnected');
      const status = useConnectionStore.getState().status;
      expect(status).toBe('disconnected');
    });

    it('обновляет статус с "connecting" на "connected"', () => {
      const { setStatus } = useConnectionStore.getState();

      setStatus('connecting');
      expect(useConnectionStore.getState().status).toBe('connecting');

      setStatus('connected');
      expect(useConnectionStore.getState().status).toBe('connected');
    });

    it('обновляет статус с "connected" на "disconnected"', () => {
      const { setStatus } = useConnectionStore.getState();

      setStatus('connected');
      expect(useConnectionStore.getState().status).toBe('connected');

      setStatus('disconnected');
      expect(useConnectionStore.getState().status).toBe('disconnected');
    });
  });

  describe('подписки на изменения', () => {
    it('подписывается на изменения статуса', () => {
      const statuses: ConnectionStatus[] = [];

      const unsubscribe = useConnectionStore.subscribe((state) => {
        statuses.push(state.status);
      });

      const { setStatus } = useConnectionStore.getState();

      setStatus('connecting');
      setStatus('connected');
      setStatus('disconnected');

      expect(statuses).toEqual(['connecting', 'connected', 'disconnected']);

      unsubscribe();
    });

    it('отписывается от изменений', () => {
      const statuses: ConnectionStatus[] = [];

      const unsubscribe = useConnectionStore.subscribe((state) => {
        statuses.push(state.status);
      });

      const { setStatus } = useConnectionStore.getState();

      setStatus('connecting');
      expect(statuses).toHaveLength(1);

      unsubscribe();

      setStatus('connected');
      expect(statuses).toHaveLength(1);
    });
  });

  describe('селекторы', () => {
    it('позволяет использовать селектор для получения статуса', () => {
      const selectStatus = (state: { status: ConnectionStatus }) => state.status;
      const selectedStatus = selectStatus(useConnectionStore.getState());
      expect(selectedStatus).toBe('disconnected');
    });

    it('позволяет использовать селектор для получения setStatus', () => {
      const selectSetStatus = (state: { setStatus: (status: ConnectionStatus) => void }) =>
        state.setStatus;
      const setStatus = selectSetStatus(useConnectionStore.getState());

      expect(setStatus).toBeDefined();
      expect(typeof setStatus).toBe('function');
    });
  });

  describe('множественные обновления', () => {
    it('корректно обрабатывает несколько быстрых обновлений', () => {
      const { setStatus } = useConnectionStore.getState();

      setStatus('connecting');
      setStatus('connected');
      setStatus('disconnected');
      setStatus('connecting');
      setStatus('connected');

      const status = useConnectionStore.getState().status;
      expect(status).toBe('connected');
    });

    it('сохраняет только последнее состояние при быстрых обновлениях', () => {
      const statuses: ConnectionStatus[] = [];

      const unsubscribe = useConnectionStore.subscribe((state) => {
        statuses.push(state.status);
      });

      const { setStatus } = useConnectionStore.getState();

      setStatus('connecting');
      setStatus('connected');
      setStatus('disconnected');

      expect(statuses).toHaveLength(3);
      expect(statuses[0]).toBe('connecting');
      expect(statuses[1]).toBe('connected');
      expect(statuses[2]).toBe('disconnected');

      unsubscribe();
    });
  });

  describe('интеграция с хуками', () => {
    it('возвращает правильный статус при использовании хука', () => {
      const initialStatus = useConnectionStore.getState().status;
      expect(initialStatus).toBe('disconnected');

      useConnectionStore.getState().setStatus('connecting');
      expect(useConnectionStore.getState().status).toBe('connecting');

      useConnectionStore.getState().setStatus('connected');
      expect(useConnectionStore.getState().status).toBe('connected');
    });
  });
});
