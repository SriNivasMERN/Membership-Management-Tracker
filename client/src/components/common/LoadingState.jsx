import React from 'react';
import { Box, CircularProgress } from '@mui/material';

function LoadingState() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default LoadingState;

