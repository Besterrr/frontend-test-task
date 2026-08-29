import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { App } from './App';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { queryClient } from './lib/queryClient';
import './index.css';

const theme = createTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </LocalizationProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
);
