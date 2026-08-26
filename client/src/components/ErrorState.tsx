import { Alert, Button, Stack } from '@mui/material';
import { isApiError } from '../api/errors';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void | Promise<unknown>;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message = isApiError(error) ? error.message : 'Не удалось загрузить данные';

  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Alert severity="error">{message}</Alert>
      {onRetry && (
        <Button
          variant="outlined"
          onClick={() => {
            void onRetry();
          }}
        >
          Повторить
        </Button>
      )}
    </Stack>
  );
}
