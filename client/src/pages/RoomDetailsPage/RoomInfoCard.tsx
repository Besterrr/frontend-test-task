import { Divider, Stack, Typography } from '@mui/material';
import {
  PeopleAltOutlined as PeopleIcon,
  TvOutlined as TvIcon,
  EditOutlined as EditIcon,
  VideocamOutlined as VideocamIcon,
  RoomPreferencesOutlined as DefaultFeatureIcon,
} from '@mui/icons-material';
import type { RoomSummary } from '../../api/models';
import styles from './RoomInfoCard.module.css';

interface RoomInfoCardProps {
  room: RoomSummary;
}

type FeatureIcon = typeof TvIcon;

const FEATURE_ICONS: Record<string, FeatureIcon> = {
  display: TvIcon,
  whiteboard: EditIcon,
  video: VideocamIcon,
};

export function RoomInfoCard({ room }: RoomInfoCardProps) {
  return (
    <div className={styles.card}>
      <Typography variant="h5" className={styles.card__title}>
        {room.name}
      </Typography>
      <Typography variant="body2" className={styles.card__subtitle}>
        {room.office.name} · {room.office.address}
      </Typography>

      <Divider className={styles.card__divider} />

      <Stack spacing={1.5}>
        <div className={styles.card__row}>
          <PeopleIcon className={styles.card__icon} fontSize="small" />
          <span>Вместимость: до {room.capacity} человек</span>
        </div>
        {room.features.map((feature) => {
          const Icon = FEATURE_ICONS[feature.code] ?? DefaultFeatureIcon;
          return (
            <div className={styles.card__row} key={feature.code}>
              <Icon className={styles.card__icon} fontSize="small" />
              <span>{feature.name}</span>
            </div>
          );
        })}
      </Stack>
    </div>
  );
}
