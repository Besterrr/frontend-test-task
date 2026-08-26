import { MenuItem, Stack, TextField } from '@mui/material';
import type { Office } from '../../api/models';
import type { BookingsFilters } from './useBookingsFilters';

interface BookingsFiltersBarProps {
  offices: Office[];
  filters: BookingsFilters;
  onChange: (patch: Partial<BookingsFilters>) => void;
}

const SCOPE_OPTIONS: { value: BookingsFilters['scope']; label: string }[] = [
  { value: 'upcoming', label: 'Предстоящие' },
  { value: 'past', label: 'Прошедшие' },
  { value: 'all', label: 'Все' },
];

export function BookingsFiltersBar({ offices, filters, onChange }: BookingsFiltersBarProps) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
      <TextField
        select
        label="Период"
        value={filters.scope}
        onChange={(e) => onChange({ scope: e.target.value as BookingsFilters['scope'] })}
        sx={{ minWidth: 200 }}
      >
        {SCOPE_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Офис"
        value={filters.officeId ?? ''}
        onChange={(e) => onChange({ officeId: e.target.value || null })}
        sx={{ minWidth: 240 }}
      >
        <MenuItem value="">Все офисы</MenuItem>
        {offices.map((office) => (
          <MenuItem key={office.id} value={office.id}>
            {office.name}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
