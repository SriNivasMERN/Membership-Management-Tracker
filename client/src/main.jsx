import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import App from './App.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5f7a61',
      light: '#7e9780',
      dark: '#4c634e',
    },
    secondary: {
      main: '#8c6a43',
      light: '#a88258',
      dark: '#725536',
    },
    background: {
      default: '#e8eee6',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#374151',
    },
    divider: 'rgba(17, 24, 39, 0.12)',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Sora", "Manrope", system-ui, -apple-system, sans-serif',
    allVariants: {
      fontWeight: 600,
    },
    fontWeightRegular: 600,
    fontWeightMedium: 700,
    body1: {
      fontSize: '1rem',
      lineHeight: 1.65,
      color: '#111827',
    },
    body2: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      color: '#374151',
    },
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          fontWeight: 700,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          background: 'linear-gradient(135deg, #5f7a61 0%, #728f74 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 24px rgba(95, 122, 97, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a735c 0%, #6a856d 100%)',
            boxShadow: '0 14px 28px rgba(95, 122, 97, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: 'rgba(15, 23, 42, 0.24)',
          color: '#0f172a',
          '&:hover': {
            borderColor: 'rgba(15, 23, 42, 0.42)',
            backgroundColor: 'rgba(15, 118, 110, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.72)',
          border: '1px solid rgba(95, 122, 97, 0.22)',
          boxShadow: '0 8px 20px rgba(39, 51, 40, 0.12)',
          backdropFilter: 'blur(12px) saturate(125%)',
          WebkitBackdropFilter: 'blur(12px) saturate(125%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          background: 'rgba(255, 255, 255, 0.78)',
          border: '1px solid rgba(95, 122, 97, 0.24)',
          boxShadow: '0 10px 22px rgba(39, 51, 40, 0.12)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 220ms ease',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 140ms ease, box-shadow 160ms ease',
          '&.MuiTableRow-hover:hover': {
            animation: 'none',
            backgroundColor: 'rgba(15, 118, 110, 0.16)',
            boxShadow: '0 0 0 1px rgba(15, 118, 110, 0.42), 0 0 26px rgba(15, 118, 110, 0.34)',
          },
          '&.MuiTableRow-hover:hover .MuiTableCell-root': {
            color: '#111827',
            backgroundColor: 'rgba(15, 118, 110, 0.16)',
            fontWeight: 700,
            borderTop: '1px solid rgba(15, 118, 110, 0.45)',
            borderBottom: '1px solid rgba(15, 118, 110, 0.45)',
          },
          '&.MuiTableRow-hover:hover .MuiTableCell-root:first-of-type': {
            borderLeft: '4px solid #0f766e',
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          },
          '&.MuiTableRow-hover:hover .MuiTableCell-root:last-of-type': {
            borderRight: '2px solid rgba(15, 118, 110, 0.55)',
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
          },
          '@media (prefers-reduced-motion: reduce)': {
            '&.MuiTableRow-hover:hover': {
              animation: 'none',
            },
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '@keyframes hoverZoomOutIn': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(0.94)' },
          '70%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        body: {
          background: `
            radial-gradient(circle at 8% 10%, ${alpha('#7e9780', 0.18)} 0%, transparent 38%),
            radial-gradient(circle at 92% 88%, ${alpha('#8c6a43', 0.16)} 0%, transparent 42%),
            linear-gradient(170deg, #e8eee6 0%, #ecf1e8 56%, #e6ede3 100%)
          `,
          backgroundAttachment: 'fixed',
          backgroundSize: '100% 100%, 100% 100%, 100% 100%',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <BrowserRouter>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>
);

