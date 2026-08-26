import { useState, useRef, useEffect } from 'react';
import styles from './DurationDropdown.module.css';

interface DurationDropdownProps {
  selectedDuration?: number; // в часах
  onChange?: (duration: number) => void;
}

export function DurationDropdown({ selectedDuration = 1, onChange }: DurationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Генерируем варианты от 15 минут до 2 часов с шагом 15 минут
  const durationOptions = [
    { value: 0.25, label: '15 мин' },
    { value: 0.5, label: '30 мин' },
    { value: 0.75, label: '45 мин' },
    { value: 1, label: '1 час' },
    { value: 1.25, label: '1 час 15 мин' },
    { value: 1.5, label: '1 час 30 мин' },
    { value: 1.75, label: '1 час 45 мин' },
    { value: 2, label: '2 часа' },
  ];

  const getLabel = (value: number): string => {
    const option = durationOptions.find((opt) => opt.value === value);
    return option ? option.label : '1 час';
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (value: number) => {
    onChange?.(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.durationDropdown} ref={dropdownRef}>
      {/* Триггер */}
      <div className={styles.durationDropdown__trigger} onClick={toggleDropdown}>
        <span className={styles.durationDropdown__value}>{getLabel(selectedDuration)}</span>
        <svg
          className={`${styles.durationDropdown__arrow} ${isOpen ? styles.durationDropdown__arrow_open : ''}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path d="M1 1L6 6L11 1" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Выпадающий список */}
      {isOpen && (
        <div className={styles.durationDropdown__menu}>
          {durationOptions.map((option) => (
            <div
              key={option.value}
              className={`
                ${styles.durationDropdown__item}
                ${selectedDuration === option.value ? styles.durationDropdown__item_selected : ''}
              `}
              onClick={() => handleSelect(option.value)}
            >
              <span className={styles.durationDropdown__itemLabel}>{option.label}</span>
              {selectedDuration === option.value && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8L6.5 11.5L13 4"
                    stroke="#0D9488"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
