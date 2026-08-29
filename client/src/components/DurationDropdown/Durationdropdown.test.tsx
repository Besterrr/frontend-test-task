import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DurationDropdown } from './DurationDropdown';

function getTrigger(container: HTMLElement): HTMLElement {
  const trigger = container.querySelector<HTMLElement>('[class*="trigger"]');
  if (!trigger) throw new Error('Триггер не найден');
  return trigger;
}

function getMenu(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('[class*="menu"]');
}

describe('DurationDropdown', () => {
  it('отображает "1 час" по умолчанию', () => {
    const { container } = render(<DurationDropdown />);
    expect(getTrigger(container)).toHaveTextContent('1 час');
  });

  it('отображает переданное значение selectedDuration', () => {
    const { container } = render(<DurationDropdown selectedDuration={1.5} />);
    expect(getTrigger(container)).toHaveTextContent('1 час 30 мин');
  });

  it('отображает "1 час", если передано неизвестное значение', () => {
    const { container } = render(<DurationDropdown selectedDuration={3.7} />);
    expect(getTrigger(container)).toHaveTextContent('1 час');
  });

  it('открывает список вариантов по клику на триггер', async () => {
    const user = userEvent.setup();
    const { container } = render(<DurationDropdown />);

    expect(getMenu(container)).not.toBeInTheDocument();

    await user.click(getTrigger(container));

    const menu = getMenu(container);
    expect(menu).toBeInTheDocument();
    expect(within(menu!).getByText('15 мин')).toBeInTheDocument();
    expect(within(menu!).getByText('2 часа')).toBeInTheDocument();
  });

  it('закрывает список при повторном клике на триггер', async () => {
    const user = userEvent.setup();
    const { container } = render(<DurationDropdown />);

    await user.click(getTrigger(container));
    expect(getMenu(container)).toBeInTheDocument();

    await user.click(getTrigger(container));
    expect(getMenu(container)).not.toBeInTheDocument();
  });

  it('вызывает onChange с выбранным значением и закрывает список', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<DurationDropdown onChange={onChange} />);

    await user.click(getTrigger(container));
    const menu = getMenu(container);
    await user.click(within(menu!).getByText('45 мин'));

    expect(onChange).toHaveBeenCalledWith(0.75);
    expect(getMenu(container)).not.toBeInTheDocument();
  });

  it('закрывает список при клике вне компонента', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div>
        <DurationDropdown />
        <div data-testid="outside">Снаружи</div>
      </div>,
    );

    await user.click(getTrigger(container));
    expect(getMenu(container)).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));
    expect(getMenu(container)).not.toBeInTheDocument();
  });

  it('отображает все 8 вариантов длительности от 15 минут до 2 часов', async () => {
    const user = userEvent.setup();
    const { container } = render(<DurationDropdown />);

    await user.click(getTrigger(container));
    const menu = getMenu(container);

    const expectedLabels = [
      '15 мин',
      '30 мин',
      '45 мин',
      '1 час',
      '1 час 15 мин',
      '1 час 30 мин',
      '1 час 45 мин',
      '2 часа',
    ];
    expectedLabels.forEach((label) => {
      expect(within(menu!).getByText(label)).toBeInTheDocument();
    });
  });

  it('обновляет отображаемый лейбл при выборе другого варианта (rerender родителем)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <DurationDropdown selectedDuration={1} onChange={onChange} />,
    );

    await user.click(getTrigger(container));
    const menu = getMenu(container);
    await user.click(within(menu!).getByText('30 мин'));

    expect(onChange).toHaveBeenCalledWith(0.5);

    rerender(<DurationDropdown selectedDuration={0.5} onChange={onChange} />);
    expect(getTrigger(container)).toHaveTextContent('30 мин');
  });

  it('устанавливает role="combobox" и aria-expanded на триггере', async () => {
    const user = userEvent.setup();
    const { container } = render(<DurationDropdown />);
    const trigger = getTrigger(container);

    expect(trigger).toHaveAttribute('role', 'combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('открывает список по нажатию Enter на триггере с клавиатуры', async () => {
    const user = userEvent.setup();
    const { container } = render(<DurationDropdown />);
    const trigger = getTrigger(container);

    trigger.focus();
    await user.keyboard('{Enter}');

    expect(getMenu(container)).toBeInTheDocument();
  });

  it('закрывает список по Escape и возвращает фокус на триггер', async () => {
    const user = userEvent.setup();
    const { container } = render(<DurationDropdown />);
    const trigger = getTrigger(container);

    await user.click(trigger);
    expect(getMenu(container)).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(getMenu(container)).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('список имеет role="listbox", а пункты role="option"', async () => {
    const user = userEvent.setup();
    const { container } = render(<DurationDropdown />);

    await user.click(getTrigger(container));
    const menu = getMenu(container);

    expect(menu).toHaveAttribute('role', 'listbox');
    const options = menu?.querySelectorAll('[role="option"]');
    expect(options?.length).toBe(8);
  });

  it('выбранный пункт имеет aria-selected="true"', async () => {
    const user = userEvent.setup();
    const { container } = render(<DurationDropdown selectedDuration={0.5} />);

    await user.click(getTrigger(container));
    const menu = getMenu(container);
    const selectedOption = within(menu!).getByText('30 мин').closest('[role="option"]');

    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  });
});
