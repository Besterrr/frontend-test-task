import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from './Calendar';

describe('Calendar', () => {
  it('отображает месяц и год выбранной даты', () => {
    render(<Calendar selectedDate={new Date(2026, 7, 15)} />);
    expect(screen.getByText('Август 2026')).toBeInTheDocument();
  });

  it('отображает текущий месяц, если selectedDate не передан', () => {
    const now = new Date();
    const monthNames = [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ];
    render(<Calendar />);
    expect(
      screen.getByText(`${monthNames[now.getMonth()]} ${now.getFullYear()}`),
    ).toBeInTheDocument();
  });

  it('переключает на следующий месяц по клику на стрелку вперёд', async () => {
    const user = userEvent.setup();
    render(<Calendar selectedDate={new Date(2026, 7, 15)} />);

    await user.click(screen.getByRole('button', { name: 'Следующий месяц' }));

    expect(screen.getByText('Сентябрь 2026')).toBeInTheDocument();
  });

  it('переключает на предыдущий месяц по клику на стрелку назад', async () => {
    const user = userEvent.setup();
    render(<Calendar selectedDate={new Date(2026, 7, 15)} />);

    await user.click(screen.getByRole('button', { name: 'Предыдущий месяц' }));

    expect(screen.getByText('Июль 2026')).toBeInTheDocument();
  });

  it('переключает год при переходе через границу декабрь → январь', async () => {
    const user = userEvent.setup();
    render(<Calendar selectedDate={new Date(2026, 11, 15)} />);

    await user.click(screen.getByRole('button', { name: 'Следующий месяц' }));

    expect(screen.getByText('Январь 2027')).toBeInTheDocument();
  });

  it('вызывает onSelectDate с датой в UTC при клике по доступному дню', async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(
      <Calendar
        selectedDate={new Date(2026, 7, 1)}
        onSelectDate={onSelectDate}
        minDate={new Date(2026, 7, 1)}
        maxDate={new Date(2026, 7, 31)}
      />,
    );

    await user.click(screen.getByRole('button', { name: '15' }));

    expect(onSelectDate).toHaveBeenCalledTimes(1);
    const calledWith = onSelectDate.mock.calls[0]?.[0] as Date;
    expect(calledWith.getUTCFullYear()).toBe(2026);
    expect(calledWith.getUTCMonth()).toBe(7);
    expect(calledWith.getUTCDate()).toBe(15);
  });

  it('делает дни раньше minDate недоступными для выбора', () => {
    render(
      <Calendar
        selectedDate={new Date(2026, 7, 15)}
        minDate={new Date(2026, 7, 10)}
        maxDate={new Date(2026, 7, 31)}
      />,
    );

    expect(screen.getByRole('button', { name: '5' })).toBeDisabled();
  });

  it('делает дни позже maxDate недоступными для выбора', () => {
    render(
      <Calendar
        selectedDate={new Date(2026, 7, 15)}
        minDate={new Date(2026, 7, 1)}
        maxDate={new Date(2026, 7, 20)}
      />,
    );

    expect(screen.getByRole('button', { name: '25' })).toBeDisabled();
  });

  it('не вызывает onSelectDate при клике по недоступному дню', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSelectDate = vi.fn();
    render(
      <Calendar
        selectedDate={new Date(2026, 7, 15)}
        onSelectDate={onSelectDate}
        minDate={new Date(2026, 7, 10)}
        maxDate={new Date(2026, 7, 20)}
      />,
    );

    const disabledDay = screen.getByRole('button', { name: '5' });
    expect(disabledDay).toBeDisabled();
    // disabled-элементы не получают события клика в реальном браузере (pointer-events: none),
    // поэтому userEvent.click их корректно блокирует; проверяем это через pointerEventsCheck: 0
    await user.click(disabledDay);

    expect(onSelectDate).not.toHaveBeenCalled();
  });

  it('оставляет дни в пределах диапазона доступными', () => {
    render(
      <Calendar
        selectedDate={new Date(2026, 7, 15)}
        minDate={new Date(2026, 7, 10)}
        maxDate={new Date(2026, 7, 20)}
      />,
    );

    expect(screen.getByRole('button', { name: '15' })).toBeEnabled();
  });

  it('отображает информационный текст об ограничении в 30 дней', () => {
    render(<Calendar selectedDate={new Date(2026, 7, 15)} />);
    expect(screen.getByText('Ограничение не более 30 дней вперёд.')).toBeInTheDocument();
  });

  it('рендерит все дни месяца', () => {
    // Август 2026 — 31 день
    render(<Calendar selectedDate={new Date(2026, 7, 15)} />);
    expect(screen.getByRole('button', { name: '31' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '32' })).not.toBeInTheDocument();
  });
});
