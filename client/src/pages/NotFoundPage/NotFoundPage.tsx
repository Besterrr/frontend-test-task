import { Button, Typography } from '@mui/material';
import { HomeOutlined as HomeIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.notFound}>
      <span className={styles.notFound__code}>404</span>
      <Typography variant="h6" className={styles.notFound__title}>
        Страница не найдена
      </Typography>
      <Typography variant="body2" className={styles.notFound__description}>
        Запрашиваемая страница не существует, была удалена или перенесена на другой адрес.
      </Typography>
      <Button
        component={Link}
        to="/rooms"
        variant="contained"
        startIcon={<HomeIcon />}
        className={styles.notFound__button}
      >
        Вернуться к переговорным
      </Button>
    </div>
  );
}
