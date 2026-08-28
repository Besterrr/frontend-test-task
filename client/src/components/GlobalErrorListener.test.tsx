import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { GlobalErrorListener } from './GlobalErrorListener';
import { notifyErrorGlobal } from '../lib/errorNotifications';

const enqueueSnackbarMock = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: enqueueSnackbarMock }),
}));

describe('GlobalErrorListener', () => {
  it('показывает тост при глобальной ошибке', () => {
    render(<GlobalErrorListener />);

    notifyErrorGlobal(new Error('Network Error'));

    expect(enqueueSnackbarMock).toHaveBeenCalledWith(
      'Не удалось соединиться с сервером. Проверьте подключение к интернету',
      { variant: 'error' },
    );
  });

  it('отписывается при размонтировании', () => {
    const { unmount } = render(<GlobalErrorListener />);
    unmount();
    enqueueSnackbarMock.mockClear();

    notifyErrorGlobal(new Error('Network Error'));

    expect(enqueueSnackbarMock).not.toHaveBeenCalled();
  });
});
