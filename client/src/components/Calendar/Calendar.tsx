import { useState } from 'react';
import styles from './Calendar.module.css';

interface CalendarProps {
  selectedDate?: Date | undefined;
  onSelectDate?: ((date: Date) => void) | undefined;
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
}

export function Calendar({ selectedDate, onSelectDate, minDate, maxDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const getDaysInMonth = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handlePrevMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: Date): void => {
    if (!isDisabled(date)) {
      // ✅ Создаём UTC дату из выбранной
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      onSelectDate?.(utcDate);
    }
  };

  const renderDays = (): React.ReactNode[] => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: React.ReactNode[] = [];

    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className={styles.calendar__dayEmpty} />);
    }

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isTodayDate = isToday(date);
      const isSelectedDate = isSelected(date);
      const isDisabledDate = isDisabled(date);

      let dayClassName = styles.calendar__day;
      if (isTodayDate) dayClassName += ` ${styles.calendar__day_today}`;
      if (isSelectedDate) dayClassName += ` ${styles.calendar__day_selected}`;
      if (isDisabledDate) dayClassName += ` ${styles.calendar__day_disabled}`;

      days.push(
        <button
          key={`day-${i}`}
          className={dayClassName}
          onClick={() => handleDateSelect(date)}
          disabled={isDisabledDate}
          type="button"
        >
          {i}
        </button>,
      );
    }

    return days;
  };

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

  const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  return (
    <div className={styles.calendar}>
      <div className={styles.calendar__header}>
        <span className={styles.calendar__title}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <div className={styles.calendar__nav}>
          <button
            className={styles.calendar__navButton}
            onClick={handlePrevMonth}
            type="button"
            aria-label="Предыдущий месяц"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#475569"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className={styles.calendar__navButton}
            onClick={handleNextMonth}
            type="button"
            aria-label="Следующий месяц"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18L15 12L9 6"
                stroke="#475569"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.calendar__weekDays}>
        {weekDays.map((day) => (
          <div key={day} className={styles.calendar__weekDay}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.calendar__days}>{renderDays()}</div>

      <div className={styles.calendar__footer}>
        <hr className={styles.calendar__divider} />
        <p className={styles.calendar__info}>Ограничение не более 30 дней вперёд.</p>
        <p className={styles.calendar__infoSecondary}>Даты за пределами лимита неактивны</p>
      </div>
    </div>
  );
}
