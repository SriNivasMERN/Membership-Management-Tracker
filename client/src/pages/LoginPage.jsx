import React from 'react';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const schema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, setupRequired, loading } = useAuth();
  const [error, setError] = React.useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  React.useEffect(() => {
    if (!loading && setupRequired) {
      navigate('/setup', { replace: true });
    }
  }, [loading, setupRequired, navigate]);

  const onSubmit = async (values) => {
    setError('');
    try {
      const user = await login(values.email, values.password);
      if (user.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, bgcolor: 'background.default' }}>
      <Paper sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Login to access Membership Management Tracker.
        </Typography>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
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
            label="Password"
            type="password"
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
          <Typography variant="body2" sx={{ mt: 1.5, textAlign: 'center' }}>
            Forgot password? <Link to="/reset-password">Use reset code</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;
