import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomFiltersBar } from './RoomFiltersBar';
import type { RoomsFilters } from './useRoomsFilters';
import type { Office } from '../../api/models';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';

const moscowOffice: Office = {
  id: 'office-moscow',
  name: 'Офис Москва',
  address: 'Москва, ул. Лесная, 7',
  timezone: 'Europe/Moscow',
};

const yekaterinburgOffice: Office = {
  id: 'office-yekb',
  name: 'Офис Екатеринбург',
  address: 'Екатеринбург, ул. Ленина, 1',
  timezone: 'Asia/Yekaterinburg',
};

const offices = [moscowOffice, yekaterinburgOffice];

const emptyFilters: RoomsFilters = {
  officeId: null,
  minCapacity: null,
  from: null,
  to: null,
};

function renderBar(filters: RoomsFilters, onChange = vi.fn()) {
  render(<RoomFiltersBar offices={offices} filters={filters} onChange={onChange} />);
  return { onChange };
}

function tomorrowAt(timezone: string, hour: number, minute = 0) {
  return DateTime.now()
    .setZone(timezone)
    .plus({ days: 1 })
    .set({ hour, minute, second: 0, millisecond: 0 });
}

describe('RoomFiltersBar', () => {
  it('вызывает onChange с officeId и сбрасывает интервал при выборе офиса', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar(emptyFilters);

    await user.selectOptions(screen.getByLabelText('Выберите офис'), 'office-moscow');

    expect(onChange).toHaveBeenCalledWith({
      officeId: 'office-moscow',
      from: null,
      to: null,
    });
  });

  it('поля даты и времени неактивны, пока офис не выбран', () => {
    renderBar(emptyFilters);

    expect(screen.getByPlaceholderText('Выберите дату')).toBeDisabled();
    expect(screen.getByLabelText('Время начала')).toBeDisabled();
  });

  it('поля даты и времени активны после выбора офиса', () => {
    renderBar({ ...emptyFilters, officeId: 'office-moscow' });

    expect(screen.getByPlaceholderText('Выберите дату')).not.toBeDisabled();
    expect(screen.getByLabelText('Время начала')).not.toBeDisabled();
  });

  it('ввод только времени не вызывает onChange с валидным интервалом (дата ещё не выбрана)', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ ...emptyFilters, officeId: 'office-moscow' });

    await user.type(screen.getByLabelText('Время начала'), '10:00');

    for (const call of onChange.mock.calls) {
      expect(call[0]).toEqual({ from: null, to: null });
    }
  });

  it('время не стирается при повторном вводе (регрессия бага частичного ввода)', async () => {
    const user = userEvent.setup();
    renderBar({ ...emptyFilters, officeId: 'office-moscow' });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const timeInput = screen.getByLabelText('Время начала') as HTMLInputElement;
    await user.type(timeInput, '10:15');

    expect(timeInput.value).toBe('10:15');
  });

  it('формирует корректный UTC ISO с учётом таймзоны офиса при выборе даты и времени (регрессия таймзонового бага)', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ ...emptyFilters, officeId: 'office-moscow' });

    await user.type(screen.getByLabelText('Время начала'), '10:00');

    onChange.mockClear();

    const dateInput = screen.getByPlaceholderText('Выберите дату');
    await user.click(dateInput);

    const target = tomorrowAt('Europe/Moscow', 10);
    const calendar = await screen.findByRole('button', { name: String(target.day) });
    await user.click(calendar);

    const lastCall = onChange.mock.calls.at(-1)?.[0] as { from: string; to: string };
    expect(lastCall.from).toBeDefined();

    const startUtc = new Date(lastCall.from);
    // Europe/Moscow = UTC+3(10 - 3)
    expect(startUtc.getUTCHours()).toBe(7);
    expect(startUtc.getUTCMinutes()).toBe(0);
  });

  it('использует другую таймзону для другого офиса', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ ...emptyFilters, officeId: 'office-yekb' });

    await user.type(screen.getByLabelText('Время начала'), '10:00');
    onChange.mockClear();

    await user.click(screen.getByPlaceholderText('Выберите дату'));

    const target = tomorrowAt('Asia/Yekaterinburg', 10);
    const dayButton = await screen.findByRole('button', { name: String(target.day) });
    await user.click(dayButton);

    const lastCall = onChange.mock.calls.at(-1)?.[0] as { from: string };
    const startUtc = new Date(lastCall.from);
    // Asia/Yekaterinburg = UTC+5
    expect(startUtc.getUTCHours()).toBe(5);
  });

  it('отображает выбранную дату и время из filters (синхронизация с внешним состоянием)', () => {
    const target = tomorrowAt('Europe/Moscow', 10);
    const from = target.toUTC().toISO()!;
    const to = target.plus({ hours: 1 }).toUTC().toISO()!;

    renderBar({
      ...emptyFilters,
      officeId: 'office-moscow',
      from,
      to,
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const timeInput = screen.getByLabelText('Время начала') as HTMLInputElement;
    expect(timeInput.value).toBe('10:00');
  });

  it('показывает сообщение об ошибке для интервала вне рабочих часов', () => {
    const target = tomorrowAt('Europe/Moscow', 5); // до начала рабочего дня
    const from = target.toUTC().toISO()!;
    const to = target.plus({ minutes: 15 }).toUTC().toISO()!;

    renderBar({
      ...emptyFilters,
      officeId: 'office-moscow',
      from,
      to,
    });

    expect(screen.getByText(/рабочие час/i)).toBeInTheDocument();
  });

  it('не показывает ошибку для валидного интервала', () => {
    const target = tomorrowAt('Europe/Moscow', 10);
    const from = target.toUTC().toISO()!;
    const to = target.plus({ hours: 1 }).toUTC().toISO()!;

    renderBar({
      ...emptyFilters,
      officeId: 'office-moscow',
      from,
      to,
    });

    expect(screen.queryByText(/рабочие час/i)).not.toBeInTheDocument();
  });

  it('меняет вместимость по кнопкам увеличения/уменьшения', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ ...emptyFilters, minCapacity: 4 });

    await user.click(screen.getByRole('button', { name: 'Увеличить' }));
    expect(onChange).toHaveBeenLastCalledWith({ minCapacity: 5 });

    onChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Уменьшить' }));
    expect(onChange).toHaveBeenLastCalledWith({ minCapacity: 3 });
  });

  it('не позволяет уменьшить вместимость ниже 1', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ ...emptyFilters, minCapacity: 1 });

    await user.click(screen.getByRole('button', { name: 'Уменьшить' }));

    expect(onChange).toHaveBeenLastCalledWith({ minCapacity: 1 });
  });

  it('использует значение по умолчанию 4, если minCapacity не задан', () => {
    renderBar(emptyFilters);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const capacityInput = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(capacityInput.value).toBe('4');
  });

  it('отображает адрес и локальное время выбранного офиса', () => {
    renderBar({ ...emptyFilters, officeId: 'office-moscow' });

    expect(screen.getByText(moscowOffice.address)).toBeInTheDocument();
    expect(screen.getByText(/Местное время/)).toBeInTheDocument();
  });

  it('не показывает блок с адресом офиса, если офис не выбран', () => {
    renderBar(emptyFilters);

    expect(screen.queryByText(/Местное время/)).not.toBeInTheDocument();
  });
});
