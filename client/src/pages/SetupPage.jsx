import React from 'react';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const schema = z
  .object({
    setupToken: z.string().min(32, 'Setup token is required'),
    email: z.string().email('Valid email is required'),
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(10, 'Password must be at least 10 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

function SetupPage() {
  const navigate = useNavigate();
  const { completeSetup, setupRequired, loading } = useAuth();
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { setupToken: '', email: '', name: 'Business Owner', password: '', confirmPassword: '' },
  });

  React.useEffect(() => {
    if (!loading && !setupRequired) {
      navigate('/login', { replace: true });
    }
  }, [loading, setupRequired, navigate]);

  const onSubmit = async (values) => {
    setError('');
    setSuccess('');
    try {
      await completeSetup({
        setupToken: values.setupToken,
        email: values.email,
        name: values.name,
        password: values.password,
      });
      setSuccess('Initial setup completed. Please sign in.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (err) {
      setError(err?.response?.data?.message || 'Setup failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: 'background.default' }}>
      <Paper sx={{ width: '100%', maxWidth: 500, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Initial Owner Setup
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This page is available only once before the first admin account is created.
        </Typography>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        ) : null}
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Setup Token"
            type="password"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('setupToken')}
            error={!!errors.setupToken}
            helperText={errors.setupToken?.message}
          />
          <TextField
            label="Admin Email"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Full Name"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
          <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Completing setup...' : 'Create Admin Account'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default SetupPage;
