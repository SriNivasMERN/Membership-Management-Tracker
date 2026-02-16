import React from 'react';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const schema = z
  .object({
    email: z.string().email('Valid email is required'),
    code: z.string().min(20, 'Reset code is required'),
    newPassword: z.string().min(10, 'Password must be at least 10 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: searchParams.get('email') || '',
      code: searchParams.get('code') || '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    setError('');
    setSuccess('');
    try {
      await resetPassword({
        email: values.email,
        code: values.code,
        newPassword: values.newPassword,
      });
      setSuccess('Password reset successful. You can now sign in.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (err) {
      setError(err?.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: 'background.default' }}>
      <Paper sx={{ width: '100%', maxWidth: 460, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Set New Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter your email, one-time reset code, and new password.
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
            label="Email"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Reset Code"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('code')}
            error={!!errors.code}
            helperText={errors.code?.message}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('newPassword')}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
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
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default ResetPasswordPage;
