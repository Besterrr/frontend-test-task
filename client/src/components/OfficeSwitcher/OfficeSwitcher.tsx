import { useState } from 'react';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import { KeyboardArrowDown as ArrowDownIcon } from '@mui/icons-material';
import type { Office } from '../../api/models';

interface OfficeSwitcherProps {
  offices: Office[];
  currentOffice: Office | null;
  onChange: (officeId: string) => void;
}

export function OfficeSwitcher({ offices, currentOffice, onChange }: OfficeSwitcherProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const handleSelect = (officeId: string) => {
    onChange(officeId);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={(event) => setAnchorEl(event.currentTarget)}
        endIcon={<ArrowDownIcon />}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        sx={{
          color: '#0f172a',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '20px',
          padding: 0,
          '&:hover': { backgroundColor: 'transparent' },
        }}
      >
        {currentOffice ? currentOffice.name : 'Выберите офис'}
      </Button>
      <Menu anchorEl={anchorEl} open={isOpen} onClose={() => setAnchorEl(null)}>
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
    </>
  );
}
