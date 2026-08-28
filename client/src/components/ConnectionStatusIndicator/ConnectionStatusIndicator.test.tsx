import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { useConnectionStore } from '../../store/connectionStore';

describe('ConnectionStatusIndicator', () => {
  beforeEach(() => {
    useConnectionStore.setState({ status: 'disconnected' });
  });

  it('ничего не рендерит при статусе connected', () => {
    useConnectionStore.setState({ status: 'connected' });
    const { container } = render(<ConnectionStatusIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it('показывает "Подключение…" при статусе connecting', () => {
    useConnectionStore.setState({ status: 'connecting' });
    render(<ConnectionStatusIndicator />);
    expect(screen.getByText('Подключение…')).toBeInTheDocument();
  });

  it('показывает "Переподключение…" при статусе reconnecting', () => {
    useConnectionStore.setState({ status: 'reconnecting' });
    render(<ConnectionStatusIndicator />);
    expect(screen.getByText('Переподключение…')).toBeInTheDocument();
  });

  it('показывает "Нет соединения" при статусе disconnected', () => {
    useConnectionStore.setState({ status: 'disconnected' });
    render(<ConnectionStatusIndicator />);
    expect(screen.getByText('Нет соединения')).toBeInTheDocument();
  });

  it('имеет aria-live для доступности', () => {
    useConnectionStore.setState({ status: 'reconnecting' });
    render(<ConnectionStatusIndicator />);
    expect(screen.getByText('Переподключение…').closest('[aria-live]')).toBeInTheDocument();
  });
});
