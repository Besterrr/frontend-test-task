import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
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

function Wrapper({
  filters,
  onChange,
}: {
  filters: RoomsFilters;
  onChange: (patch: Partial<RoomsFilters>) => void;
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <RoomFiltersBar offices={offices} filters={filters} onChange={onChange} />
    </LocalizationProvider>
  );
}

function renderBar(filters: RoomsFilters, onChange = vi.fn()) {
  const utils = render(<Wrapper filters={filters} onChange={onChange} />);
  return { onChange, ...utils };
}

function tomorrowAt(timezone: string, hour: number, minute = 0) {
  return DateTime.now()
    .setZone(timezone)
    .plus({ days: 1 })
    .set({ hour, minute, second: 0, millisecond: 0 });
}

async function selectOffice(user: ReturnType<typeof userEvent.setup>, officeName: string) {
  const switcher = screen.getAllByRole('button', { name: /Выберите офис|Офис/ })[0];
  if (!switcher) throw new Error('Кнопка выбора офиса не найдена');
  await user.click(switcher);
  const menu = await screen.findByRole('menu');
  await user.click(within(menu).getByText(officeName));
}

describe('RoomFiltersBar', () => {
  it('вызывает onChange с officeId и сбрасывает интервал при выборе офиса', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar(emptyFilters);

    await selectOffice(user, 'Офис Москва');

    expect(onChange).toHaveBeenCalledWith({
      officeId: 'office-moscow',
      from: null,
      to: null,
    });
  });

  it('поля даты и времени неактивны, пока офис не выбран', () => {
    renderBar(emptyFilters);

    const dateGroup = screen.getByRole('group', { name: /Дата/ });
    expect(dateGroup.className).toMatch(/Mui-disabled/);
    expect(screen.getByLabelText('Время начала')).toBeDisabled();
  });

  it('поле даты активно после выбора офиса', () => {
    renderBar({ ...emptyFilters, officeId: 'office-moscow' });

    const dateGroup = screen.getByRole('group', { name: /Дата/ });
    expect(dateGroup.className).not.toMatch(/Mui-disabled/);
  });

  it('время начала неактивно, пока дата не выбрана', () => {
    renderBar({ ...emptyFilters, officeId: 'office-moscow' });

    expect(screen.getByLabelText('Время начала')).toBeDisabled();
  });

  it('формирует корректный UTC ISO с учётом таймзоны офиса при выборе даты (регрессия таймзонового бага)', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ ...emptyFilters, officeId: 'office-moscow' });

    const dateGroup = screen.getByRole('group', { name: /Дата/ });
    await user.click(dateGroup);

    const target = tomorrowAt('Europe/Moscow', 0);
    const dateStr = target.toFormat('MM/dd/yyyy');
    await user.type(dateGroup, dateStr);
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0] as { from: string };
    expect(lastCall.from).toBeDefined();

    const startUtc = new Date(lastCall.from);
    expect(startUtc.getUTCHours()).toBe(6); // 09:00 MSK -> 06:00 UTC (дефолт при выборе только даты)
  });

  it('после выбора даты и времени формирует корректный UTC интервал (регрессия таймзонового бага)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <Wrapper filters={{ ...emptyFilters, officeId: 'office-moscow' }} onChange={onChange} />,
    );

    const dateGroup = screen.getByRole('group', { name: /Дата/ });
    const target = tomorrowAt('Europe/Moscow', 10);
    await user.click(dateGroup);
    await user.type(dateGroup, target.toFormat('MM/dd/yyyy'));
    await user.keyboard('{Enter}');

    const dateCall = onChange.mock.calls.at(-1)?.[0] as { from: string; to: string };
    expect(dateCall.from).toBeDefined();

    onChange.mockClear();

    rerender(
      <Wrapper
        filters={{
          ...emptyFilters,
          officeId: 'office-moscow',
          from: dateCall.from,
          to: dateCall.to,
        }}
        onChange={onChange}
      />,
    );

    const timeInput = screen.getByLabelText('Время начала');
    fireEvent.change(timeInput, { target: { value: '10:00' } });

    const lastCall = onChange.mock.calls.at(-1)?.[0] as { from: string };
    expect(lastCall.from).toBeDefined();

    const startUtc = new Date(lastCall.from);
    expect(startUtc.getUTCHours()).toBe(7); // 10:00 MSK -> 07:00 UTC
  });

  it('использует другую таймзону для другого офиса', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ ...emptyFilters, officeId: 'office-yekb' });

    const dateGroup = screen.getByRole('group', { name: /Дата/ });
    await user.click(dateGroup);

    const target = tomorrowAt('Asia/Yekaterinburg', 0);
    await user.type(dateGroup, target.toFormat('MM/dd/yyyy'));
    await user.keyboard('{Enter}');

    const lastCall = onChange.mock.calls.at(-1)?.[0] as { from: string };
    const startUtc = new Date(lastCall.from);
    expect(startUtc.getUTCHours()).toBe(4); // 09:00 Yekaterinburg (UTC+5) -> 04:00 UTC
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
    const target = tomorrowAt('Europe/Moscow', 5);
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
    const capacityInput = screen.getByLabelText('Вместимость') as HTMLInputElement;
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
