import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { RoomSummary } from '../../api/models';
import styles from './RoomCard.module.css';

interface RoomCardProps {
  room: RoomSummary;
}

export function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate();
  const goToDetails = () => void navigate(`/rooms/${room.id}`);

  return (
    <Card
      className={styles.roomCard}
      sx={{
        borderRadius: '12px',
        border: '1px solid #e8ecf0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          borderColor: '#c5cdd6',
        },
      }}
    >
      <CardContent
        className={styles.roomCard__content}
        sx={{ padding: '20px', paddingBottom: '12px !important', flexGrow: 1 }}
      >
        <Typography
          variant="h6"
          onClick={goToDetails}
          sx={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#1a1e23',
            lineHeight: 1.4,
            letterSpacing: '-0.3px',
            cursor: 'pointer',
            display: 'inline-block',
          }}
        >
          {room.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: '14px', color: '#6b7280', marginTop: '2px', marginBottom: '12px' }}
        >
          {room.floor} этаж
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
          <Typography variant="body2" sx={{ fontSize: '14px', color: '#475569' }}>
            👥 Вместимость: до {room.capacity} человек
          </Typography>
          {room.features.length > 0 && (
            <Typography variant="body2" sx={{ fontSize: '14px', color: '#475569' }}>
              🕒 {room.features.map((feature) => feature.name).join(', ')}
            </Typography>
          )}
        </Box>

        {room.available !== undefined && (
          <div
            className={`${styles.roomCard__status} ${
              room.available ? styles.roomCard__status_available : styles.roomCard__status_busy
            }`}
          >
            <span className={styles.roomCard__statusDot} />
            {room.available ? 'Свободна' : 'Занята'}
          </div>
        )}
      </CardContent>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px 16px',
        }}
      >
        <Button
          onClick={goToDetails}
          sx={{ color: '#0d9488', textTransform: 'none', fontWeight: 500, padding: 0, minWidth: 0 }}
        >
          Подробнее
        </Button>
        <Button
          variant="contained"
          disabled={room.available === false}
          onClick={goToDetails}
          sx={{
            backgroundColor: '#0d9488',
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#0f766e' },
          }}
        >
          Забронировать
        </Button>
      </Box>
    </Card>
  );
}
