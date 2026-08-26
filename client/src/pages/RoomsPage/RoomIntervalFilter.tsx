import { useMemo, useState } from 'react';
import { Stack, MenuItem, TextField, FormHelperText } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DateTime } from 'luxon';
import {
  addMinutesIso,
  toOfficeIso,
  validateOfficeInterval,
  INTERVAL_STEP_MINUTES,
} from '../../lib/officeTime';

interface RoomIntervalFilterProps {
  timezone: string | null;
  from: string | null;
  to: string | null;
  onChange: (patch: { from: string | null; to: string | null }) => void;
}

const DURATION_OPTIONS_MIN = [15, 30, 45, 60, 90, 120];

export function RoomIntervalFilter({ timezone, from, to, onChange }: RoomIntervalFilterProps) {
  const [localDate, setLocalDate] = useState<DateTime | null>(
    from && timezone ? DateTime.fromISO(from).setZone(timezone) : null,
  );
  const [localStartTime, setLocalStartTime] = useState<DateTime | null>(
    from && timezone ? DateTime.fromISO(from).setZone(timezone) : null,
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    if (!from || !to) return 60;
    return DateTime.fromISO(to).diff(DateTime.fromISO(from), 'minutes').minutes;
  });

  const error = useMemo(() => {
    if (!timezone || !from || !to) return null;
    return validateOfficeInterval(from, to, timezone);
  }, [timezone, from, to]);

  function applyInterval(date: DateTime | null, time: DateTime | null, duration: number) {
    if (!timezone || !date || !time) {
      onChange({ from: null, to: null });
      return;
    }
    const startIso = toOfficeIso(date.toISODate() ?? '', time.toFormat('HH:mm'), timezone);
    if (!startIso) {
      onChange({ from: null, to: null });
      return;
    }
    const endIso = addMinutesIso(startIso, duration);
    onChange({ from: startIso, to: endIso });
  }

  if (!timezone) {
    return null; // выбор интервала имеет смысл только после выбора офиса
  }

  return (
    <Stack spacing={1}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <DatePicker
          label="Дата"
          value={localDate}
          minDate={DateTime.now().setZone(timezone)}
          maxDate={DateTime.now().setZone(timezone).plus({ days: 30 })}
          onChange={(value) => {
            setLocalDate(value);
            applyInterval(value, localStartTime, durationMinutes);
          }}
          sx={{ minWidth: 180 }}
        />
        <TimePicker
          label="Время начала"
          value={localStartTime}
          minutesStep={INTERVAL_STEP_MINUTES}
          onChange={(value) => {
            setLocalStartTime(value);
            applyInterval(localDate, value, durationMinutes);
          }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          select
          label="Продолжительность"
          value={durationMinutes}
          onChange={(e) => {
            const next = Number(e.target.value);
            setDurationMinutes(next);
            applyInterval(localDate, localStartTime, next);
          }}
          sx={{ minWidth: 180 }}
        >
          {DURATION_OPTIONS_MIN.map((minutes) => (
            <MenuItem key={minutes} value={minutes}>
              {minutes < 60
                ? `${minutes} мин`
                : `${minutes / 60} ч${minutes % 60 ? ` ${minutes % 60} мин` : ''}`}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      {error && <FormHelperText error>{error.message}</FormHelperText>}
    </Stack>
  );
}
