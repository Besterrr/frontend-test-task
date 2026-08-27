// client/src/pages/RoomsPage/RoomFiltersBar.tsx
import { DateTime } from 'luxon';
import { useEffect, useRef, useState } from 'react';
import type { Office } from '../../api/models';
import { Calendar } from '../../components/Calendar';
import { DurationDropdown } from '../../components/DurationDropdown';
import {
  toOfficeIso,
  addMinutesIso,
  validateOfficeInterval,
  MAX_ADVANCE_DAYS,
} from '../../lib/officeTime';
import type { RoomsFilters } from './useRoomsFilters';
import styles from './RoomFiltersBar.module.css';

interface RoomFiltersBarProps {
  offices: Office[];
  filters: RoomsFilters;
  onChange: (patch: Partial<RoomsFilters>) => void;
}

const DEFAULT_CAPACITY = 4;
const DEFAULT_DURATION_HOURS = 1;

export function RoomFiltersBar({ offices, filters, onChange }: RoomFiltersBarProps) {
  const currentOffice = offices.find((office) => office.id === filters.officeId) ?? null;
  const timezone = currentOffice?.timezone ?? null;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const localStart =
    timezone && filters.from ? DateTime.fromISO(filters.from).setZone(timezone) : null;
  const localDate = localStart?.toISODate() ?? '';
  const localTime = localStart?.toFormat('HH:mm') ?? '';

  const duration =
    timezone && filters.from && filters.to
      ? DateTime.fromISO(filters.to)
          .setZone(timezone)
          .diff(DateTime.fromISO(filters.from).setZone(timezone), 'minutes').minutes / 60
      : DEFAULT_DURATION_HOURS;

  const capacity = filters.minCapacity ?? DEFAULT_CAPACITY;

  const intervalError =
    timezone && filters.from && filters.to
      ? (validateOfficeInterval(filters.from, filters.to, timezone)?.message ?? null)
      : null;

  function applyInterval(date: string, time: string, durationHours: number) {
    if (!timezone || !date || !time) {
      onChange({ from: null, to: null });
      return;
    }
    const startIso = toOfficeIso(date, time, timezone);
    if (!startIso) {
      onChange({ from: null, to: null });
      return;
    }
    const endIso = addMinutesIso(startIso, durationHours * 60);
    onChange({ from: startIso, to: endIso });
  }

  const handleOfficeChange = (officeId: string) => {
    onChange({ officeId, from: null, to: null });
  };

  const handleDateChange = (date: string) => {
    applyInterval(date, localTime, duration);
    setIsCalendarOpen(false);
  };

  const handleTimeChange = (time: string) => {
    applyInterval(localDate, time, duration);
  };

  const handleDurationChange = (value: number) => {
    applyInterval(localDate, localTime, value);
  };

  const handleCapacityChange = (value: number) => {
    const next = Number.isFinite(value) && value > 0 ? value : 1;
    onChange({ minCapacity: next });
  };

  const handleCapacityUp = () => handleCapacityChange(capacity + 1);
  const handleCapacityDown = () => handleCapacityChange(capacity - 1);

  const handleCalendarSelect = (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    handleDateChange(`${year}-${month}-${day}`);
  };

  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const minDate = timezone ? DateTime.now().setZone(timezone).toJSDate() : new Date();
  const maxDate = timezone
    ? DateTime.now().setZone(timezone).plus({ days: MAX_ADVANCE_DAYS }).toJSDate()
    : undefined;

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return 'Выберите дату';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return 'Выберите дату';
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return 'Выберите дату';

    const monthNames = [
      'Января',
      'Февраля',
      'Марта',
      'Апреля',
      'Мая',
      'Июня',
      'Июля',
      'Августа',
      'Сентября',
      'Октября',
      'Ноября',
      'Декабря',
    ];
    const weekDays = [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ];
    return `${d.getDate()}, ${monthNames[d.getMonth()]}, ${weekDays[d.getDay()]}`;
  };

  const selectedDateObj = localDate
    ? (() => {
        const parts = localDate.split('-');
        if (parts.length !== 3) return undefined;
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      })()
    : undefined;

  return (
    <div className={styles.filtersBar}>
      <div className={styles.filtersBar__header}>
        <div className={styles.filtersBar__officeSelect}>
          <label className={styles.filtersBar__label}>Выберите офис</label>
          <select
            className={styles.filtersBar__select}
            value={filters.officeId ?? ''}
            onChange={(e) => handleOfficeChange(e.target.value)}
          >
            <option value="">Выберите офис</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentOffice && (
        <div className={styles.filtersBar__officeInfo}>
          <span className={styles.filtersBar__address}>{currentOffice.address}</span>
          <span className={styles.filtersBar__divider}>•</span>
          <span className={styles.filtersBar__time}>
            Местное время: {DateTime.now().setZone(currentOffice.timezone).toFormat('HH:mm')}
          </span>
        </div>
      )}

      <hr className={styles.filtersBar__divider} />

      <div className={styles.filtersBar__params}>
        <div className={styles.filtersBar__param}>
          <label className={styles.filtersBar__label}>Дата</label>
          <div className={styles.filtersBar__dateWrapper}>
            <input
              type="text"
              className={`${styles.filtersBar__input} ${localDate ? styles.filtersBar__input_filled : ''}`}
              value={formatDateDisplay(localDate)}
              onFocus={() => setIsCalendarOpen(true)}
              readOnly
              placeholder="Выберите дату"
              disabled={!timezone}
            />
            {isCalendarOpen && (
              <div className={styles.filtersBar__calendarDropdown} ref={calendarRef}>
                <Calendar
                  selectedDate={selectedDateObj}
                  onSelectDate={handleCalendarSelect}
                  minDate={minDate}
                  maxDate={maxDate}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.filtersBar__param}>
          <label className={styles.filtersBar__label}>Время начала</label>
          <input
            type="time"
            className={styles.filtersBar__input}
            value={localTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={!timezone}
            step={900}
          />
        </div>

        <div className={styles.filtersBar__param}>
          <label className={styles.filtersBar__label}>Длительность</label>
          <DurationDropdown selectedDuration={duration} onChange={handleDurationChange} />
        </div>

        <div className={styles.filtersBar__param}>
          <label className={styles.filtersBar__label}>Вместимость</label>
          <div className={styles.filtersBar__capacity}>
            <input
              type="number"
              className={styles.filtersBar__capacityInput}
              value={capacity}
              onChange={(e) => handleCapacityChange(Number(e.target.value))}
              min={1}
            />
            <div className={styles.filtersBar__capacityControls}>
              <button
                type="button"
                className={styles.filtersBar__capacityBtn}
                onClick={handleCapacityUp}
                aria-label="Увеличить"
              >
                ▲
              </button>
              <button
                type="button"
                className={styles.filtersBar__capacityBtn}
                onClick={handleCapacityDown}
                aria-label="Уменьшить"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      {intervalError && <p className={styles.filtersBar__error}>{intervalError}</p>}
    </div>
  );
}
