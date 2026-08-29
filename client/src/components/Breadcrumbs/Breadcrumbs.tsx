import { Link as RouterLink } from 'react-router-dom';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className={styles.breadcrumbs__item}>
            {item.to && !isLast ? (
              <RouterLink to={item.to} className={styles.breadcrumbs__link}>
                {item.label}
              </RouterLink>
            ) : (
              <span className={isLast ? styles.breadcrumbs__current : styles.breadcrumbs__link}>
                {item.label}
              </span>
            )}
            {!isLast && <span className={styles.breadcrumbs__separator}>›</span>}
          </span>
        );
      })}
    </nav>
  );
}
