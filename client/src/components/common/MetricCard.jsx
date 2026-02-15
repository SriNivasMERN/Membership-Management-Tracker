import React from 'react';
import { Box, Paper, Skeleton, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

function MetricCard({ title, subtitle, value, icon: Icon, tone, loading = false }) {
  const theme = useTheme();
  const toneColor = theme.palette[tone]?.main || theme.palette.primary.main;

  return (
    <Paper
      sx={{
        p: 2.25,
        minHeight: 120,
        borderRadius: 2,
        background: `linear-gradient(155deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
        border: `2px solid ${alpha(theme.palette.text.primary, 0.26)}`,
        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 240ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 240ms ease',
        '@keyframes glowDrift': {
          '0%': { transform: 'translateX(-120%)' },
          '60%': { transform: 'translateX(160%)' },
          '100%': { transform: 'translateX(160%)' },
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(100deg, transparent 25%, ${alpha(toneColor, 0.16)} 50%, transparent 75%)`,
          transform: 'translateX(-120%)',
          animation: loading ? 'none' : 'glowDrift 5.5s ease-in-out infinite',
          pointerEvents: 'none',
        },
        '&:hover': {
          animation: 'hoverZoomOutIn 450ms ease-in-out',
          boxShadow: '0 18px 30px rgba(15, 23, 42, 0.14)',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '&:hover': {
            animation: 'none',
          },
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          backgroundColor: alpha(toneColor, 0.12),
          color: toneColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {loading ? <Skeleton variant="circular" width={24} height={24} /> : <Icon fontSize="small" />}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width={120} />
            {subtitle ? <Skeleton variant="text" width={140} /> : null}
            <Skeleton variant="text" width={80} height={36} />
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {subtitle}
              </Typography>
            ) : null}
            <Typography
              variant="h4"
              sx={{
                color: 'text.primary',
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.15,
                mt: subtitle ? 0.5 : 0.75,
              }}
            >
              {value}
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
}

export default MetricCard;
