import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api/axiosClient.js';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'STAFF', 'VIEWER']),
  mobile: z.string().optional().or(z.literal('')),
});

function OneTimeCodeDialog({ open, onClose, title, code, expiresAt }) {
  const resetLink = `${window.location.origin}/reset-password`;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This code/link is shown only once. Share it securely with the user.
        </Alert>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Reset code:
        </Typography>
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'background.default' }}>
          <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{code}</Typography>
        </Paper>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Reset link:
        </Typography>
        <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'background.default' }}>
          <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{resetLink}</Typography>
        </Paper>
        <Typography variant="caption" display="block" sx={{ mb: 2 }} color="text.secondary">
          Do not include reset code in URLs. Share the code securely and enter it manually on the reset page.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Expires at: {expiresAt ? new Date(expiresAt).toLocaleString() : 'N/A'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function UserDialog({ open, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', role: 'STAFF', mobile: '' },
  });

  useEffect(() => {
    if (open) reset({ name: '', email: '', role: 'STAFF', mobile: '' });
  }, [open, reset]);

  const onSubmit = async (values) => {
    const response = await api.post('/users', values);
    onSaved(response);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create User</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.25 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Name"
              fullWidth
              size="small"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Email"
              fullWidth
              size="small"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Mobile"
              fullWidth
              size="small"
              {...register('mobile')}
              error={!!errors.mobile}
              helperText={errors.mobile?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Role"
              select
              fullWidth
              size="small"
              {...register('role')}
              error={!!errors.role}
              helperText={errors.role?.message}
            >
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="STAFF">STAFF</MenuItem>
              <MenuItem value="VIEWER">VIEWER</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function UsersPage() {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [codeDialog, setCodeDialog] = useState({
    open: false,
    title: '',
    code: '',
    expiresAt: '',
    email: '',
  });

  const loadUsers = async () => {
    const data = await api.get('/users');
    setUsers(data);
  };

  const loadAudit = async () => {
    const data = await api.get('/audit-logs', { params: { page: 1, limit: 50 } });
    setAudit(data.items);
  };

  const loadAll = async () => {
    setError('');
    try {
      await Promise.all([loadUsers(), loadAudit()]);
    } catch {
      setError('Failed to load users or audit logs.');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showResetCode = ({ title, code, expiresAt, email }) => {
    setCodeDialog({
      open: true,
      title,
      code,
      expiresAt,
      email,
    });
  };

  const handleRoleChange = async (userId, role) => {
    await api.put(`/users/${userId}`, { role });
    loadUsers();
  };

  const handleDeactivate = async (userId) => {
    await api.patch(`/users/${userId}/deactivate`, {});
    loadUsers();
  };

  const handleResetPassword = async (user) => {
    const payload = await api.post(`/users/${user._id}/reset-password`, {});
    showResetCode({
      title: `One-time reset code for ${user.email}`,
      code: payload.reset.resetCode,
      expiresAt: payload.reset.resetExpiresAt,
      email: user.email,
    });
    loadUsers();
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Users
        </Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Create User
        </Button>
      </Box>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Paper>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Users" />
          <Tab label="Audit Logs" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {tab === 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        >
                          <MenuItem value="ADMIN">ADMIN</MenuItem>
                          <MenuItem value="STAFF">STAFF</MenuItem>
                          <MenuItem value="VIEWER">VIEWER</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleResetPassword(user)}>
                          Generate Reset Code
                        </Button>
                        {user.isActive ? (
                          <Button size="small" color="error" onClick={() => handleDeactivate(user._id)}>
                            Deactivate
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>User</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {audit.map((log) => (
                    <TableRow key={`${log.createdAt}-${log.actionType}-${log.entityId || 'x'}`} hover>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{log.actionType}</TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell>{log.actorRole || 'SYSTEM'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={(response) => {
          showResetCode({
            title: `One-time reset code for ${response.user.email}`,
            code: response.onboarding.resetCode,
            expiresAt: response.onboarding.resetExpiresAt,
            email: response.user.email,
          });
          loadAll();
        }}
      />

      <OneTimeCodeDialog
        open={codeDialog.open}
        onClose={() =>
          setCodeDialog({ open: false, title: '', code: '', expiresAt: '', email: '' })
        }
        title={codeDialog.title}
        code={codeDialog.code}
        expiresAt={codeDialog.expiresAt}
      />
    </Box>
  );
}

export default UsersPage;
