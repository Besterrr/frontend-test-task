import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RoomCard } from './RoomCard';
import type { RoomSummary } from '../../api/models';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const baseRoom: RoomSummary = {
  id: 'room-everest',
  officeId: 'office-moscow',
  name: 'Эверест',
  floor: 4,
  capacity: 12,
  features: [
    { code: 'display', name: 'Проектор' },
    { code: 'whiteboard', name: 'Маркерная доска' },
  ],
  office: {
    id: 'office-moscow',
    name: 'Офис Москва',
    address: 'Москва, ул. Лесная, 7',
    timezone: 'Europe/Moscow',
  },
};

function renderCard(room: RoomSummary) {
  return render(
    <MemoryRouter>
      <RoomCard room={room} />
    </MemoryRouter>,
  );
}

describe('RoomCard', () => {
  it('отображает название, этаж и вместимость', () => {
    renderCard(baseRoom);

    expect(screen.getByText('Эверест')).toBeInTheDocument();
    expect(screen.getByText(/4\s*этаж/i)).toBeInTheDocument();
    expect(screen.getByText(/до 12 чел/)).toBeInTheDocument();
  });

  it('отображает оснащение комнаты', () => {
    renderCard(baseRoom);

    expect(screen.getByText(/Проектор/)).toBeInTheDocument();
    expect(screen.getByText(/Маркерная доска/)).toBeInTheDocument();
  });

  it('показывает статус "Свободна" когда available: true', () => {
    renderCard({ ...baseRoom, available: true });
    expect(screen.getByText('Свободна')).toBeInTheDocument();
  });

  it('показывает статус "Занята" когда available: false', () => {
    renderCard({ ...baseRoom, available: false });
    expect(screen.getByText('Занята')).toBeInTheDocument();
  });

  it('не показывает статус, если available не передан', () => {
    renderCard(baseRoom);
    expect(screen.queryByText('Свободна')).not.toBeInTheDocument();
    expect(screen.queryByText('Занята')).not.toBeInTheDocument();
  });

  it('переходит на страницу комнаты по клику', async () => {
    const user = userEvent.setup();
    renderCard(baseRoom);

    await user.click(screen.getByText('Эверест'));

    expect(navigateMock).toHaveBeenCalledWith('/rooms/room-everest');
  });

  it('кнопка "Подробнее" переходит на страницу комнаты', async () => {
    const user = userEvent.setup();
    renderCard(baseRoom);

    await user.click(screen.getByRole('button', { name: 'Подробнее' }));

    expect(navigateMock).toHaveBeenCalledWith('/rooms/room-everest');
  });

  it('кнопка "Забронировать" переходит на страницу комнаты, если комната доступна', async () => {
    const user = userEvent.setup();
    renderCard({ ...baseRoom, available: true });

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(navigateMock).toHaveBeenCalledWith('/rooms/room-everest');
  });

  it('кнопка "Забронировать" отключена, если комната недоступна', () => {
    renderCard({ ...baseRoom, available: false });

    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled();
  });

  it('кнопка "Забронировать" активна, если available не передан', () => {
    renderCard(baseRoom);

    expect(screen.getByRole('button', { name: 'Забронировать' })).not.toBeDisabled();
  });

});
