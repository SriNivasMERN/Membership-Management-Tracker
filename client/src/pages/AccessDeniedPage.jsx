import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function AccessDeniedPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: 'background.default' }}>
      <Paper sx={{ width: '100%', maxWidth: 420, p: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You do not have permission to view this page.
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Paper>
    </Box>
  );
}

export default AccessDeniedPage;
