import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { RoomSummary } from '../../api/models';

interface RoomCardProps {
  room: RoomSummary;
}

export function RoomCard({ room }: RoomCardProps) {
  const navigate = useNavigate();

  return (
    <Card variant="outlined">
      <CardActionArea onClick={() => void navigate(`/rooms/${room.id}`)}>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{room.name}</Typography>
            {room.available !== undefined && (
              <Chip
                label={room.available ? 'Свободна' : 'Занята'}
                color={room.available ? 'success' : 'default'}
                size="small"
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Этаж {room.floor} · до {room.capacity} чел.
          </Typography>
          {room.features.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {room.features.map((feature) => (
                <Chip key={feature.code} label={feature.name} size="small" variant="outlined" />
              ))}
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
