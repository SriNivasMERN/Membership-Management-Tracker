import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axiosClient.js';

const schema = z.object({
  planId: z.string().min(1),
  slotId: z.string().min(1),
  multiplier: z.coerce.number().min(0),
});

function PricingRuleDialog({ open, onClose, initialData, plans, slots, onSaved }) {
  const isEdit = Boolean(initialData);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || { planId: '', slotId: '', multiplier: 1 },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        planId: initialData.planId?._id || initialData.planId,
        slotId: initialData.slotId?._id || initialData.slotId,
        multiplier: initialData.multiplier,
      });
    } else {
      reset({ planId: '', slotId: '', multiplier: 1 });
    }
  }, [initialData, reset]);

  const onSubmit = async (values) => {
    if (isEdit) {
      await api.put(`/pricing-rules/${initialData._id}`, values);
    } else {
      await api.post('/pricing-rules', values);
    }
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Pricing Rule' : 'Add Pricing Rule'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Plan"
            select
            size="small"
            {...register('planId')}
            error={!!errors.planId}
            helperText={errors.planId?.message}
          >
            {plans.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.planName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Slot"
            select
            size="small"
            {...register('slotId')}
            error={!!errors.slotId}
            helperText={errors.slotId?.message}
          >
            {slots.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.slotLabel}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Multiplier"
            type="number"
            size="small"
            {...register('multiplier', { valueAsNumber: true })}
            error={!!errors.multiplier}
            helperText={errors.multiplier?.message}
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

function PricingRulesTab() {
  const [rules, setRules] = useState([]);
  const [plans, setPlans] = useState([]);
  const [slots, setSlots] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const loadAll = async () => {
    const [rulesRes, plansRes, slotsRes] = await Promise.all([
      api.get('/pricing-rules'),
      api.get('/plans', { params: { includeInactive: true } }),
      api.get('/slots', { params: { includeInactive: true } }),
    ]);
    setRules(rulesRes);
    setPlans(plansRes);
    setSlots(slotsRes);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreate = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const openEdit = (rule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleDelete = async (rule) => {
    await api.delete(`/pricing-rules/${rule._id}`);
    loadAll();
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
          Add Pricing Rule
        </Button>
      </Box>
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Plan</TableCell>
                <TableCell>Slot</TableCell>
                <TableCell>Multiplier</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule._id} hover>
                  <TableCell>{rule.planId?.planName || ''}</TableCell>
                  <TableCell>{rule.slotId?.slotLabel || ''}</TableCell>
                  <TableCell>{rule.multiplier}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(rule)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(rule)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No pricing rules defined.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <PricingRuleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={editingRule}
        plans={plans}
        slots={slots}
        onSaved={loadAll}
      />
    </Box>
  );
}

export default PricingRulesTab;

