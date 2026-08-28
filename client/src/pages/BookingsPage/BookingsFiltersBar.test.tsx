import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingsFiltersBar } from './BookingsFiltersBar';
import type { Office } from '../../api/models';
import type { BookingsFilters } from './useBookingsFilters';

const moscowOffice: Office = {
  id: 'office-moscow',
  name: 'Офис Москва',
  address: 'Москва, ул. Лесная, 7',
  timezone: 'Europe/Moscow',
};

const spbOffice: Office = {
  id: 'office-spb',
  name: 'Офис Санкт-Петербург',
  address: 'Санкт-Петербург, наб. реки Карповки, 5',
  timezone: 'Europe/Moscow',
};

const offices = [moscowOffice, spbOffice];

const defaultFilters: BookingsFilters = {
  scope: 'upcoming',
  officeId: null,
};

function renderBar(filters: BookingsFilters = defaultFilters, onChange = vi.fn()) {
  render(<BookingsFiltersBar offices={offices} filters={filters} onChange={onChange} />);
  return { onChange };
}

// Хелпер для получения input внутри селекта
function getSelectInput(label: string) {
  const container = screen.getByLabelText(label);
  // Находим input внутри контейнера
  const input = container.closest('.MuiInputBase-root')?.querySelector('input');
  if (!input) {
    throw new Error(`Input not found for label: ${label}`);
  }
  return input;
}

describe('BookingsFiltersBar', () => {
  it('отображает выбранное значение периода по умолчанию', () => {
    renderBar();
    expect(screen.getByLabelText('Период')).toHaveTextContent('Предстоящие');
  });

  it('не отображает конкретный офис, если он не выбран (value="")', () => {
    renderBar();
    const officeInput = getSelectInput('Офис');
    expect(officeInput).toHaveValue('');
  });

  it('вызывает onChange с новым scope при выборе "Прошедшие"', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar();

    await user.click(screen.getByLabelText('Период'));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Прошедшие'));

    expect(onChange).toHaveBeenCalledWith({ scope: 'past' });
  });

  it('вызывает onChange с новым scope при выборе "Все"', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar();

    await user.click(screen.getByLabelText('Период'));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Все'));

    expect(onChange).toHaveBeenCalledWith({ scope: 'all' });
  });

  it('вызывает onChange с officeId при выборе конкретного офиса', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar();

    await user.click(screen.getByLabelText('Офис'));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Офис Москва'));

    expect(onChange).toHaveBeenCalledWith({ officeId: 'office-moscow' });
  });

  it('вызывает onChange с officeId: null при выборе "Все офисы"', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ ...defaultFilters, officeId: 'office-moscow' });

    await user.click(screen.getByLabelText('Офис'));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Все офисы'));

    expect(onChange).toHaveBeenCalledWith({ officeId: null });
  });

  it('отображает список всех переданных офисов в выпадающем списке', async () => {
    const user = userEvent.setup();
    renderBar();

    await user.click(screen.getByLabelText('Офис'));
    const listbox = await screen.findByRole('listbox');

    expect(within(listbox).getByText('Офис Москва')).toBeInTheDocument();
    expect(within(listbox).getByText('Офис Санкт-Петербург')).toBeInTheDocument();
  });

  it('работает с пустым списком офисов', () => {
    render(<BookingsFiltersBar offices={[]} filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Офис')).toBeInTheDocument();
  });

  it('отображает выбранный ранее офис из filters', () => {
    renderBar({ ...defaultFilters, officeId: 'office-spb' });
    const officeInput = getSelectInput('Офис');
    expect(officeInput).toHaveValue('office-spb');
  });
});
