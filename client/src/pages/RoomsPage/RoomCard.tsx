import { Card, CardActionArea, CardContent, Chip,Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { RoomSummary } from '../../api/models';
import styles from './RoomCard.module.css';

interface RoomCardProps {
  room: RoomSummary;
}

export function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={styles.roomCard}
      sx={{
        borderRadius: '12px',
        border: '1px solid #e8ecf0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease',
        height: '100%',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          borderColor: '#c5cdd6',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardActionArea
        className={styles.roomCard__actionArea}
        onClick={() => void navigate(`/rooms/${room.id}`)}
        sx={{ padding: 0 }}
      >
        <CardContent
          className={styles.roomCard__content}
          sx={{
            padding: '20px',
            '&:last-child': {
              paddingBottom: '20px',
            },
          }}
        >
          <div className={styles.roomCard__header}>
            <Typography
              variant="h6"
              className={styles.roomCard__name}
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1a1e23',
                lineHeight: 1.4,
                letterSpacing: '-0.3px',
              }}
            >
              {room.name}
            </Typography>
            {room.available !== undefined && (
              <Chip
                label={room.available ? 'Свободна' : 'Занята'}
                className={`${styles.roomCard__status} ${
                  room.available ? styles.roomCard__status_available : styles.roomCard__status_busy
                }`}
                size="small"
                sx={{
                  fontWeight: 500,
                  fontSize: '12px',
                  borderRadius: '20px',
                  flexShrink: 0,
                  marginLeft: '12px',
                  ...(room.available
                    ? {
                        backgroundColor: '#e6f7e6',
                        color: '#1e7e34',
                      }
                    : {
                        backgroundColor: '#f5f5f5',
                        color: '#6b7280',
                      }),
                }}
              />
            )}
          </div>
          <Typography
            variant="body2"
            color="text.secondary"
            className={styles.roomCard__info}
            sx={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: 1.5,
              marginBottom: '12px',
            }}
          >
            Этаж {room.floor} · до {room.capacity} чел.
          </Typography>
          {room.features.length > 0 && (
            <div className={styles.roomCard__features}>
              {room.features.map((feature) => (
                <Chip
                  key={feature.code}
                  label={feature.name}
                  size="small"
                  variant="outlined"
                  className={styles.roomCard__feature}
                  sx={{
                    fontSize: '12px',
                    color: '#4b5563',
                    backgroundColor: '#f9fafb',
                    borderColor: '#e5e7eb',
                    borderRadius: '6px',
                    '& .MuiChip-label': {
                      padding: '0 10px',
                    },
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
