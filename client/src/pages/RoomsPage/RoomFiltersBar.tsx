import { useState, useRef, useEffect } from 'react';
import type { Office } from '../../api/models';
import { Calendar } from '../../components/Calendar';
import { DurationDropdown } from '../../components/DurationDropdown';
import type { RoomsFilters } from './useRoomsFilters';
import styles from './RoomFiltersBar.module.css';

interface RoomFiltersBarProps {
  offices: Office[];
  filters: RoomsFilters;
  onChange: (patch: Partial<RoomsFilters>) => void;
}

export function RoomFiltersBar({ offices, filters, onChange }: RoomFiltersBarProps) {
  const [selectedOffice, setSelectedOffice] = useState<string>(filters.officeId || '');
  const [date, setDate] = useState<string>(filters.from || '');
  const [from, setFrom] = useState<string>(filters.from || '');
  const [duration, setDuration] = useState<number>(1);
  const [capacity, setCapacity] = useState<number>(filters.minCapacity || 4);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const calendarRef = useRef<HTMLDivElement>(null);

  const handleOfficeChange = (officeId: string) => {
    setSelectedOffice(officeId);
    onChange({ officeId });
  };

  const handleDateChange = (date: string) => {
    setDate(date);
    onChange({ from: date });
    setIsCalendarOpen(false);
  };

  const handleFromChange = (from: string) => {
    setFrom(from);
    if (date && from) {
      const dateTime = `${date}T${from}:00`;
      onChange({ from: dateTime });
    } else {
      onChange({ from });
    }
  };

  const handleDurationChange = (duration: number) => {
    setDuration(duration);

    if (from && date) {
      const [hours, minutes] = from.split(':').map(Number);
      const totalMinutes = (hours || 0) * 60 + (minutes || 0) + duration * 60;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = Math.round(totalMinutes % 60);
      const toTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
      const dateTime = `${date}T${toTime}:00`;
      onChange({ to: dateTime });
    }
  };

  const handleCapacityChange = (value: number) => {
    setCapacity(value);
    onChange({ minCapacity: value });
  };

  const handleCapacityUp = () => {
    const newValue = (capacity || 0) + 1;
    setCapacity(newValue);
    onChange({ minCapacity: newValue });
  };

  const handleCapacityDown = () => {
    if ((capacity || 0) > 1) {
      const newValue = (capacity || 0) - 1;
      setCapacity(newValue);
      onChange({ minCapacity: newValue });
    }
  };

  const handleCalendarSelect = (selectedDate: Date) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    handleDateChange(formattedDate);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const currentOffice = offices.find((office) => office.id === selectedOffice);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return 'Выберите дату';

    let datePart: string = dateStr;
    if (dateStr.includes('T')) {
      const parts = dateStr.split('T');
      datePart = parts[0] || dateStr;
    }

    const parts = datePart.split('-');
    if (parts.length !== 3) return 'Выберите дату';

    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    if (isNaN(d.getTime())) return 'Выберите дату';

    const day = d.getDate();
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

    return `${day}, ${monthNames[d.getMonth()]}, ${weekDays[d.getDay()]}`;
  };

  const selectedDateObj = date
    ? (() => {
        let datePart: string = date;
        if (date.includes('T')) {
          const parts = date.split('T');
          datePart = parts[0] || date;
        }
        const parts = datePart.split('-');
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
            value={selectedOffice}
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
            Местное время:{' '}
            {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} MSK
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
              className={`${styles.filtersBar__input} ${date ? styles.filtersBar__input_filled : ''}`}
              value={formatDateDisplay(date)}
              onFocus={() => setIsCalendarOpen(true)}
              readOnly
              placeholder="Выберите дату"
            />
            {isCalendarOpen && (
              <div className={styles.filtersBar__calendarDropdown} ref={calendarRef}>
                <Calendar
                  selectedDate={selectedDateObj}
                  onSelectDate={handleCalendarSelect}
                  minDate={new Date()}
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
            value={from || ''}
            onChange={(e) => handleFromChange(e.target.value)}
            placeholder="--:--"
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
              value={capacity || ''}
              onChange={(e) => handleCapacityChange(Number(e.target.value))}
              min={1}
            />
            <div className={styles.filtersBar__capacityControls}>
              <button
                className={styles.filtersBar__capacityBtn}
                onClick={handleCapacityUp}
                aria-label="Увеличить"
              >
                ▲
              </button>
              <button
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
    </div>
  );
}
