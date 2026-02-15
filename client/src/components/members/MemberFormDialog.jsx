import React, { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { z } from 'zod';
import api from '../../api/axiosClient.js';
import { useSettings } from '../../context/SettingsContext.jsx';

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    mobile: z
      .string()
      .regex(/^[0-9]{10}$/, 'Mobile must be exactly 10 digits'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    selectedPlanId: z.string().min(1, 'Plan is required'),
    selectedSlotId: z.string().min(1, 'Slot is required'),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    price: z.coerce.number().min(0),
    fullyPaid: z.boolean(),
    pendingAmount: z.coerce.number().min(0),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const start = dayjs(data.startDate);
    const end = dayjs(data.endDate);
    if (end.isBefore(start, 'day')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be on or after start date',
      });
    }
    if (data.fullyPaid && data.pendingAmount !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pendingAmount'],
        message: 'Pending amount must be 0 when fully paid',
      });
    }
    if (!data.fullyPaid && data.pendingAmount < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pendingAmount'],
        message: 'Pending amount cannot be negative',
      });
    }
  });

function MemberFormDialog({ open, onClose, initialData, onSaved }) {
  const isEdit = Boolean(initialData?._id);
  const { settings } = useSettings();
  const [plans, setPlans] = React.useState([]);
  const [slots, setSlots] = React.useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      selectedPlanId: '',
      selectedSlotId: '',
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
      price: 0,
      fullyPaid: true,
      pendingAmount: 0,
      notes: '',
    },
  });

  const selectedPlanId = watch('selectedPlanId');
  const selectedSlotId = watch('selectedSlotId');
  const fullyPaid = watch('fullyPaid');
  const startDate = watch('startDate');

  const selectedPlan = useMemo(
    () => plans.find((p) => p._id === selectedPlanId),
    [plans, selectedPlanId]
  );

  useEffect(() => {
    if (!open) return;
    const fetchMeta = async () => {
      const [plansRes, slotsRes] = await Promise.all([
        api.get('/plans', { params: { includeInactive: true } }),
        api.get('/slots', { params: { includeInactive: true } }),
      ]);
      setPlans(plansRes);
      setSlots(slotsRes);
    };
    fetchMeta();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          mobile: initialData.mobile,
          email: initialData.email || '',
          selectedPlanId: initialData.selectedPlanId || initialData.planSnapshot?.planId,
          selectedSlotId: initialData.selectedSlotId || initialData.slotSnapshot?.slotId,
          startDate: dayjs(initialData.startDate).format('YYYY-MM-DD'),
          endDate: dayjs(initialData.endDate).format('YYYY-MM-DD'),
          price: initialData.price,
          fullyPaid: initialData.fullyPaid,
          pendingAmount: initialData.pendingAmount,
          notes: initialData.notes || '',
        });
      } else {
        reset({
          name: '',
          mobile: '',
          email: '',
          selectedPlanId: '',
          selectedSlotId: '',
          startDate: dayjs().format('YYYY-MM-DD'),
          endDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
          price: 0,
          fullyPaid: true,
          pendingAmount: 0,
          notes: '',
        });
      }
    }
  }, [open, initialData, reset]);

  // Adjust endDate when plan or startDate changes (for new member)
  useEffect(() => {
    if (!selectedPlan || !startDate || initialData) return;
    const newEnd = dayjs(startDate).add(selectedPlan.validityMonths, 'month');
    setValue('endDate', newEnd.format('YYYY-MM-DD'));
  }, [selectedPlan, startDate, setValue, initialData]);

  // Recalculate default price when plan+slot selected on create (or when editing, do not override)
  useEffect(() => {
    const shouldRecalc = selectedPlan && selectedSlotId && !initialData;
    if (!shouldRecalc) return;

    const fetchPrice = async () => {
      try {
        // Respect pricing mode and rules from the server.
        if (settings?.pricingMode === 'PLAN_PLUS_SLOT_MULTIPLIER') {
          const rules = await api.get('/pricing-rules', {
            params: { planId: selectedPlan._id, slotId: selectedSlotId },
          });

          let nextPrice = selectedPlan.basePrice;
          if (Array.isArray(rules) && rules.length > 0 && typeof rules[0].multiplier === 'number') {
            nextPrice = Math.round(selectedPlan.basePrice * rules[0].multiplier * 100) / 100;
          }
          setValue('price', nextPrice);
        } else {
          setValue('price', selectedPlan.basePrice);
        }
      } catch {
        // Fallback to base price if anything goes wrong while fetching pricing rules
        setValue('price', selectedPlan.basePrice);
      }
    };

    fetchPrice();
  }, [selectedPlan, selectedSlotId, setValue, initialData, settings?.pricingMode]);

  // Ensure pendingAmount is 0 when fullyPaid is true
  useEffect(() => {
    if (fullyPaid) {
      setValue('pendingAmount', 0);
    }
  }, [fullyPaid, setValue]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      startDate: values.startDate,
      endDate: values.endDate,
    };
    if (isEdit) {
      await api.put(`/members/${initialData._id}`, payload);
    } else {
      await api.post('/members', payload);
    }
    if (onSaved) onSaved();
    onClose();
  };

  const memberLabel = settings?.memberLabel || 'Member';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? `Edit ${memberLabel}` : `Add ${memberLabel}`}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
              label={settings?.planLabel || 'Plan'}
              select
              fullWidth
              size="small"
              {...register('selectedPlanId')}
              error={!!errors.selectedPlanId}
              helperText={errors.selectedPlanId?.message}
            >
              {plans.map((plan) => (
                <MenuItem key={plan._id} value={plan._id}>
                  {plan.planName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label={settings?.slotLabel || 'Slot'}
              select
              fullWidth
              size="small"
              {...register('selectedSlotId')}
              error={!!errors.selectedSlotId}
              helperText={errors.selectedSlotId?.message}
            >
              {slots.map((slot) => (
                <MenuItem key={slot._id} value={slot._id}>
                  {slot.slotLabel}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              {...register('startDate')}
              error={!!errors.startDate}
              helperText={errors.startDate?.message}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              {...register('endDate')}
              error={!!errors.endDate}
              helperText={errors.endDate?.message}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Price"
              type="number"
              fullWidth
              size="small"
              {...register('price', { valueAsNumber: true })}
              error={!!errors.price}
              helperText={errors.price?.message}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Pending Amount"
              type="number"
              fullWidth
              size="small"
              {...register('pendingAmount', { valueAsNumber: true })}
              error={!!errors.pendingAmount}
              helperText={errors.pendingAmount?.message}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Checkbox {...register('fullyPaid')} checked={fullyPaid} />}
              label="Fully Paid"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Notes"
              fullWidth
              size="small"
              multiline
              minRows={2}
              {...register('notes')}
              error={!!errors.notes}
              helperText={errors.notes?.message}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} variant="contained">
          {isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MemberFormDialog;

