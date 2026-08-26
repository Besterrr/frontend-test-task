import { Stack, TextField, MenuItem } from '@mui/material';
import type { Office } from '../../api/models';
import type { RoomsFilters } from './useRoomsFilters';
import { RoomIntervalFilter } from './RoomIntervalFilter';

interface RoomFiltersBarProps {
  offices: Office[];
  filters: RoomsFilters;
  onChange: (patch: Partial<RoomsFilters>) => void;
}

export function RoomFiltersBar({ offices, filters, onChange }: RoomFiltersBarProps) {
  const selectedOffice = offices.find((office) => office.id === filters.officeId);

  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          select
          label="Офис"
          value={filters.officeId ?? ''}
          onChange={(e) => onChange({ officeId: e.target.value || null })}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">— выберите офис —</MenuItem>
          {offices.map((office) => (
            <MenuItem key={office.id} value={office.id}>
              {office.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          type="number"
          label="Мин. вместимость"
          value={filters.minCapacity ?? ''}
          onChange={(e) =>
            onChange({ minCapacity: e.target.value ? Number(e.target.value) : null })
          }
          slotProps={{ htmlInput: { min: 1 } }}
          sx={{ width: 200 }}
        />
      </Stack>
      <RoomIntervalFilter
        timezone={selectedOffice?.timezone ?? null}
        from={filters.from}
        to={filters.to}
        onChange={(interval) => onChange(interval)}
      />
    </Stack>
  );
}
