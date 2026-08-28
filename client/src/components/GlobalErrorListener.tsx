import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { onGlobalError } from '../lib/errorNotifications';

export function GlobalErrorListener() {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    return onGlobalError((message) => {
      enqueueSnackbar(message, { variant: 'error' });
    });
  }, [enqueueSnackbar]);

  return null;
}
