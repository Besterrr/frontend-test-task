import { Chip } from '@mui/material';
import { SyncProblem as SyncProblemIcon, CloudOff as CloudOffIcon } from '@mui/icons-material';
import { useConnectionStore } from '../../store/connectionStore';

const LABELS: Record<string, string> = {
  connecting: 'Подключение…',
  reconnecting: 'Переподключение…',
  disconnected: 'Нет соединения',
};

export function ConnectionStatusIndicator() {
  const status = useConnectionStore((state) => state.status);

  if (status === 'connected') return null;

  const icon = status === 'disconnected' ? <CloudOffIcon /> : <SyncProblemIcon />;

  return (
    <Chip
      icon={icon}
      label={LABELS[status] ?? status}
      color={status === 'disconnected' ? 'error' : 'warning'}
      size="small"
      variant="outlined"
      aria-live="polite"
    />
  );
}
