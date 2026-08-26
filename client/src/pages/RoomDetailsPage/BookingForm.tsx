import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DateTime } from 'luxon';
import { Stack, TextField, MenuItem, Button, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking } from '../../api/bookings';
import { isApiError } from '../../api/errors';
import {
  createBookingFormSchema,
  bookingFormValuesToInterval,
  type BookingFormInput,
  type BookingFormOutput,
} from './bookingFormSchema';
import { INTERVAL_STEP_MINUTES, MAX_ADVANCE_DAYS } from '../../lib/officeTime';

interface BookingFormProps {
  roomId: string;
  timezone: string;
  onCreated?: () => void;
}

const DURATION_OPTIONS_MIN = [15, 30, 45, 60, 90, 120];

export function BookingForm({ roomId, timezone, onCreated }: BookingFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const now = DateTime.now().setZone(timezone);
  const schema = createBookingFormSchema({ timezone, now });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<BookingFormInput, unknown, BookingFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      roomId,
      title: '',
      comment: null,
      date: null,
      startTime: null,
      durationMinutes: 60,
    },
  });

  const { mutateAsync } = useMutation({
    mutationFn: createBooking,
  });

  const onSubmit: SubmitHandler<BookingFormOutput> = async (values) => {
    const interval = bookingFormValuesToInterval(values, timezone);
    if (!interval) return;

    try {
      await mutateAsync({
        roomId,
        title: values.title,
        comment: values.comment,
        startsAt: interval.startsAt,
        endsAt: interval.endsAt,
      });
      enqueueSnackbar('Бронирование создано', { variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['rooms', roomId] });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onCreated?.();
    } catch (error) {
      if (isApiError(error) && error.code === 'BOOKING_CONFLICT') {
        setError('startTime', {
          type: 'server',
          message: 'Переговорная уже забронирована на выбранное время',
        });
        return;
      }
      enqueueSnackbar(isApiError(error) ? error.message : 'Не удалось создать бронирование', {
        variant: 'error',
      });
    }
  };

  return (
    <Stack
      component="form"
      spacing={2}
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
      sx={{ maxWidth: 420 }}
    >
      <TextField
        label="Тема встречи"
        {...register('title')}
        error={Boolean(errors.title)}
        helperText={errors.title?.message}
        required
      />

      <TextField
        label="Комментарий"
        {...register('comment', {
          setValueAs: (value: string) => (value.trim() === '' ? null : value),
        })}
        error={Boolean(errors.comment)}
        helperText={errors.comment?.message}
        multiline
        minRows={2}
      />

      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <DatePicker
            label="Дата"
            value={field.value}
            onChange={field.onChange}
            minDate={now}
            maxDate={now.plus({ days: MAX_ADVANCE_DAYS })}
            slotProps={{
              textField: { error: Boolean(errors.date), helperText: errors.date?.message },
            }}
          />
        )}
      />

      <Controller
        control={control}
        name="startTime"
        render={({ field }) => (
          <TimePicker
            label="Время начала"
            value={field.value}
            onChange={field.onChange}
            minutesStep={INTERVAL_STEP_MINUTES}
            slotProps={{
              textField: {
                error: Boolean(errors.startTime),
                helperText: errors.startTime?.message,
              },
            }}
          />
        )}
      />

      <Controller
        control={control}
        name="durationMinutes"
        render={({ field }) => (
          <TextField
            select
            label="Продолжительность"
            value={field.value}
            onChange={(e) => field.onChange(Number(e.target.value))}
            error={Boolean(errors.durationMinutes)}
            helperText={errors.durationMinutes?.message}
          >
            {DURATION_OPTIONS_MIN.map((minutes) => (
              <MenuItem key={minutes} value={minutes}>
                {minutes < 60
                  ? `${minutes} мин`
                  : `${minutes / 60} ч${minutes % 60 ? ` ${minutes % 60} мин` : ''}`}
              </MenuItem>
            ))}
          </TextField>
        )}
      />

      {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}

      <Button type="submit" variant="contained" disabled={isSubmitting}>
        Забронировать
      </Button>
    </Stack>
  );
}
