import styles from './BookingsTabs.module.css';

interface BookingsTabsProps {
  active: 'upcoming' | 'past';
  upcomingCount: number;
  onChange: (tab: 'upcoming' | 'past') => void;
}

export function BookingsTabs({ active, upcomingCount, onChange }: BookingsTabsProps) {
  return (
    <div className={styles.tabs}>
      <button
        type="button"
        className={`${styles.tabs__tab} ${active === 'upcoming' ? styles.tabs__tab_active : ''}`}
        onClick={() => onChange('upcoming')}
      >
        Предстоящие ({upcomingCount})
      </button>
      <button
        type="button"
        className={`${styles.tabs__tab} ${active === 'past' ? styles.tabs__tab_active : ''}`}
        onClick={() => onChange('past')}
      >
        Прошедшие
      </button>
    </div>
  );
}
