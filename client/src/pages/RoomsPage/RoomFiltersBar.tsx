import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import {
  ScheduleOutlined as ClockIcon,
  PeopleAltOutlined as PeopleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { OfficeSwitcher } from '../../components/OfficeSwitcher';
import { DurationDropdown } from '../../components/DurationDropdown';
import {
  toOfficeIso,
  addMinutesIso,
  validateOfficeInterval,
  MAX_ADVANCE_DAYS,
} from '../../lib/officeTime';
import type { Office } from '../../api/models';
import type { RoomsFilters } from './useRoomsFilters';
import styles from './RoomFiltersBar.module.css';

interface RoomFiltersBarProps {
  offices: Office[];
  filters: RoomsFilters;
  onChange: (patch: Partial<RoomsFilters>) => void;
}

const DEFAULT_CAPACITY = 4;
const DEFAULT_DURATION_HOURS = 1;

function deriveDateTime(from: string | null, timezone: string | null) {
  if (!from || !timezone) return { date: null as DateTime | null, time: '' };
  const start = DateTime.fromISO(from).setZone(timezone);
  return { date: start.startOf('day'), time: start.toFormat('HH:mm') };
}

export function RoomFiltersBar({ offices, filters, onChange }: RoomFiltersBarProps) {
  const currentOffice = offices.find((office) => office.id === filters.officeId) ?? null;
  const timezone = currentOffice?.timezone ?? null;

  const derived = deriveDateTime(filters.from, timezone);
  const localDate = derived.date;

  const [timeInput, setTimeInput] = useState(derived.time);

  useEffect(() => {
    setTimeInput(derived.time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, timezone]);

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

  const handleDateChange = (date: DateTime | null) => {
    if (!date) {
      onChange({ from: null, to: null });
      return;
    }
    applyInterval(date.toISODate() ?? '', timeInput || '09:00', duration);
  };

  const handleTimeInput = (value: string) => {
    setTimeInput(value);
    if (!localDate || !value) return;
    if (/^\d{2}:\d{2}$/.test(value)) {
      applyInterval(localDate.toISODate() ?? '', value, duration);
    }
  };

  const handleDurationChange = (value: number) => {
    if (!localDate || !timeInput) return;
    applyInterval(localDate.toISODate() ?? '', timeInput, value);
  };

  const handleCapacityChange = (value: number) => {
    const next = Number.isFinite(value) && value > 0 ? value : 1;
    onChange({ minCapacity: next });
  };

  const handleCapacityUp = () => handleCapacityChange(capacity + 1);
  const handleCapacityDown = () => handleCapacityChange(capacity - 1);

  const minDate = timezone
    ? DateTime.now().setZone(timezone).startOf('day')
    : DateTime.now().startOf('day');
  const maxDate = timezone
    ? DateTime.now().setZone(timezone).plus({ days: MAX_ADVANCE_DAYS }).startOf('day')
    : DateTime.now().plus({ days: MAX_ADVANCE_DAYS }).startOf('day');

  return (
    <div className={styles.filtersBar}>
      <div className={styles.filtersBar__header}>
        <OfficeSwitcher
          offices={offices}
          currentOffice={currentOffice}
          onChange={handleOfficeChange}
        />
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
          <span className={styles.filtersBar__label}>Дата</span>
          <DatePicker
            label="Дата"
            value={localDate}
            onChange={handleDateChange}
            minDate={minDate}
            maxDate={maxDate}
            disabled={!timezone}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                className: styles.filtersBar__pillField,
              },
            }}
          />
        </div>

        <div className={styles.filtersBar__param}>
          <label htmlFor="rooms-start-time" className={styles.filtersBar__label}>
            Время начала
          </label>
          <div className={styles.filtersBar__pill}>
            <ClockIcon className={styles.filtersBar__pillIcon} fontSize="small" />
            <input
              id="rooms-start-time"
              type="time"
              className={styles.filtersBar__pillInput}
              value={timeInput}
              onChange={(e) => handleTimeInput(e.target.value)}
              disabled={!timezone || !localDate}
              step={900}
            />
          </div>
        </div>

        <div className={styles.filtersBar__param}>
          <span className={styles.filtersBar__label}>Длительность</span>
          <DurationDropdown selectedDuration={duration} onChange={handleDurationChange} />
        </div>

        <div className={styles.filtersBar__param}>
          <label htmlFor="rooms-capacity" className={styles.filtersBar__label}>
            Вместимость
          </label>
          <div className={styles.filtersBar__pill}>
            <PeopleIcon className={styles.filtersBar__pillIcon} fontSize="small" />
            <span className={styles.filtersBar__pillPrefix}>Мин.</span>
            <input
              id="rooms-capacity"
              type="number"
              className={styles.filtersBar__capacityInput}
              value={capacity}
              onChange={(e) => handleCapacityChange(Number(e.target.value))}
              min={1}
            />
            <span className={styles.filtersBar__pillSuffix}>чел.</span>
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
