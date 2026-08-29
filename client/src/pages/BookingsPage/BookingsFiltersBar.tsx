import { useState } from 'react';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  CalendarMonthOutlined as CalendarIcon,
} from '@mui/icons-material';
import type { Office } from '../../api/models';
import type { BookingsFilters } from './useBookingsFilters';

interface BookingsFiltersBarProps {
  offices: Office[];
  filters: BookingsFilters;
  onChange: (patch: Partial<BookingsFilters>) => void;
}

export function BookingsFiltersBar({ offices, filters, onChange }: BookingsFiltersBarProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const currentOffice = offices.find((office) => office.id === filters.officeId) ?? null;

  const handleSelect = (officeId: string | null) => {
    onChange({ officeId });
    setAnchorEl(null);
  };

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Button
        onClick={(event) => setAnchorEl(event.currentTarget)}
        endIcon={<ArrowDownIcon />}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        variant="outlined"
        sx={{
          color: '#0f172a',
          borderColor: '#e2e8f0',
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '8px',
        }}
      >
        {currentOffice ? currentOffice.name : 'Все офисы'}
      </Button>
      <Menu anchorEl={anchorEl} open={isOpen} onClose={() => setAnchorEl(null)}>
        <MenuItem selected={!currentOffice} onClick={() => handleSelect(null)}>
          <Typography variant="body2">Все офисы</Typography>
        </MenuItem>
        {offices.map((office) => (
          <MenuItem
            key={office.id}
            selected={office.id === currentOffice?.id}
            onClick={() => handleSelect(office.id)}
          >
            <Typography variant="body2">{office.name}</Typography>
          </MenuItem>
        ))}
      </Menu>

      <Button
        startIcon={<CalendarIcon />}
        variant="outlined"
        disabled
        sx={{
          color: '#0f172a',
          borderColor: '#e2e8f0',
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '8px',
          '&.Mui-disabled': { color: '#0f172a', borderColor: '#e2e8f0' },
        }}
      >
        За все время
      </Button>
    </div>
  );
}
