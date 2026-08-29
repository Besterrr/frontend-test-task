import { useState, useRef, useEffect, useId } from 'react';
import styles from './DurationDropdown.module.css';

interface DurationDropdownProps {
  selectedDuration?: number;
  onChange?: (duration: number) => void;
}

export function DurationDropdown({ selectedDuration = 1, onChange,  }: DurationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

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

  const selectedIndex = durationOptions.findIndex((opt) => opt.value === selectedDuration);

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveIndex(null);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      setIsOpen(true);
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  };

  const handleSelect = (value: number) => {
    onChange?.(value);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      toggleDropdown();
    } else if (event.key === 'Escape' && isOpen) {
      closeDropdown();
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (activeIndex === null) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min((prev ?? 0) + 1, durationOptions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max((prev ?? 0) - 1, 0));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = durationOptions[activeIndex];
      if (option) handleSelect(option.value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
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
      <div
        ref={triggerRef}
        className={styles.durationDropdown__trigger}
        onClick={toggleDropdown}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label="Продолжительность"
      >
        <span className={styles.durationDropdown__value}>{getLabel(selectedDuration)}</span>
        <svg
          className={`${styles.durationDropdown__arrow} ${isOpen ? styles.durationDropdown__arrow_open : ''}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          aria-hidden="true"
        >
          <path d="M1 1L6 6L11 1" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {isOpen && (
        <div
          id={listboxId}
          className={styles.durationDropdown__menu}
          role="listbox"
          aria-label="Продолжительность"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {durationOptions.map((option, index) => (
            <div
              key={option.value}
              role="option"
              aria-selected={selectedDuration === option.value}
              tabIndex={-1}
              className={`
                ${styles.durationDropdown__item}
                ${selectedDuration === option.value ? styles.durationDropdown__item_selected : ''}
                ${activeIndex === index ? (styles.durationDropdown__item_active ?? '') : ''}
              `}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span className={styles.durationDropdown__itemLabel}>{option.label}</span>
              {selectedDuration === option.value && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
