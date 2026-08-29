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

describe('BookingsFiltersBar', () => {
  it('показывает "Все офисы" по умолчанию', () => {
    renderBar();
    expect(screen.getByRole('button', { name: /Все офисы/ })).toBeInTheDocument();
  });

  it('показывает название выбранного офиса', () => {
    renderBar({ ...defaultFilters, officeId: 'office-spb' });
    expect(screen.getByRole('button', { name: /Офис Санкт-Петербург/ })).toBeInTheDocument();
  });

  it('открывает меню офисов по клику', async () => {
    const user = userEvent.setup();
    renderBar();

    await user.click(screen.getByRole('button', { name: /Все офисы/ }));

    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Офис Москва')).toBeInTheDocument();
    expect(within(menu).getByText('Офис Санкт-Петербург')).toBeInTheDocument();
  });

  it('вызывает onChange с officeId при выборе конкретного офиса', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar();

    await user.click(screen.getByRole('button', { name: /Все офисы/ }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByText('Офис Москва'));

    expect(onChange).toHaveBeenCalledWith({ officeId: 'office-moscow' });
  });

  it('вызывает onChange с officeId: null при выборе "Все офисы"', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ ...defaultFilters, officeId: 'office-moscow' });

    await user.click(screen.getByRole('button', { name: /Офис Москва/ }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByText('Все офисы'));

    expect(onChange).toHaveBeenCalledWith({ officeId: null });
  });

  it('работает с пустым списком офисов', () => {
    render(<BookingsFiltersBar offices={[]} filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Все офисы/ })).toBeInTheDocument();
  });

  it('отображает неактивную кнопку периода "За все время"', () => {
    renderBar();
    const periodButton = screen.getByRole('button', { name: /За все время/ });
    expect(periodButton).toBeDisabled();
  });
});
