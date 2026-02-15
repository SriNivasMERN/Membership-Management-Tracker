import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axiosClient.js';
import { useSettings } from '../../context/SettingsContext.jsx';

const schema = z.object({
  planName: z.string().min(1),
  basePrice: z.coerce.number().min(0),
  validityMonths: z.coerce.number().int().min(1),
  isActive: z.boolean().optional(),
});

function PlanFormDialog({ open, onClose, initialData, onSaved }) {
  const isEdit = Boolean(initialData);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || { planName: '', basePrice: 0, validityMonths: 1 },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({ planName: '', basePrice: 0, validityMonths: 1 });
    }
  }, [initialData, reset]);

  const onSubmit = async (values) => {
    if (isEdit) {
      await api.put(`/plans/${initialData._id}`, values);
    } else {
      await api.post('/plans', values);
    }
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Plan Name"
            size="small"
            {...register('planName')}
            error={!!errors.planName}
            helperText={errors.planName?.message}
          />
          <TextField
            label="Base Price"
            size="small"
            type="number"
            {...register('basePrice', { valueAsNumber: true })}
            error={!!errors.basePrice}
            helperText={errors.basePrice?.message}
          />
          <TextField
            label="Validity (months)"
            size="small"
            type="number"
            {...register('validityMonths', { valueAsNumber: true })}
            error={!!errors.validityMonths}
            helperText={errors.validityMonths?.message}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} variant="contained">
          {isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PlansTab() {
  const { settings } = useSettings();
  const [plans, setPlans] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const loadPlans = async () => {
    const data = await api.get('/plans', { params: { includeInactive: true } });
    setPlans(data);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreate = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const toggleActive = async (plan) => {
    await api.patch(`/plans/${plan._id}/deactivate`, { isActive: !plan.isActive });
    loadPlans();
  };

  return (
    <Box>
      <Box mb={1} display="flex" justifyContent="flex-end">
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={openCreate}
        >
          {`Add ${settings?.planLabel || 'Plan'}`}
        </Button>
      </Box>
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Base Price</TableCell>
                <TableCell>Validity (months)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan._id} hover>
                  <TableCell>{plan.planName}</TableCell>
                  <TableCell>
                    {settings?.currencySymbol || '₹'}
                    {plan.basePrice}
                  </TableCell>
                  <TableCell>{plan.validityMonths}</TableCell>
                  <TableCell>
                    {plan.isActive ? (
                      <Chip label="Active" size="small" color="success" />
                    ) : (
                      <Chip label="Inactive" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(plan)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => toggleActive(plan)}>
                      {plan.isActive ? (
                        <ToggleOffIcon fontSize="small" />
                      ) : (
                        <ToggleOnIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No plans found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <PlanFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={editingPlan}
        onSaved={loadPlans}
      />
    </Box>
  );
}

export default PlansTab;

