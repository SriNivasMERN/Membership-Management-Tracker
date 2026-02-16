import React from 'react';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const schema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(10, 'Password must be at least 10 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword } = useAuth();
  const [error, setError] = React.useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    setError('');
    try {
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to change password');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: 'background.default' }}>
      <Paper sx={{ width: '100%', maxWidth: 460, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Change Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Password change is required before continuing.
        </Typography>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Current Password"
            type="password"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('oldPassword')}
            error={!!errors.oldPassword}
            helperText={errors.oldPassword?.message}
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
            {isSubmitting ? 'Saving...' : 'Update Password'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default ChangePasswordPage;
