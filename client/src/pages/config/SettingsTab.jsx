import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Grid,
  TextField,
} from '@mui/material';
import api from '../../api/axiosClient.js';
import { useSettings } from '../../context/SettingsContext.jsx';

const schema = z.object({
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  branchName: z.string().min(1),
  logoUrl: z.string().url().optional().or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  memberLabel: z.string().min(1),
  planLabel: z.string().min(1),
  slotLabel: z.string().min(1),
  currencySymbol: z.string().min(1),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMinutes: z.coerce.number().int().min(1),
  nearingExpiryDays: z.coerce.number().int().min(0),
  pricingMode: z.enum(['PLAN_ONLY', 'PLAN_PLUS_SLOT_MULTIPLIER']),
});

function SettingsTab() {
  const { settings, setSettings } = useSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: settings || {},
  });

  React.useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (values) => {
    const updated = await api.put('/settings', values);
    setSettings(updated);
  };

  if (!settings) return null;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Business Name"
            fullWidth
            size="small"
            {...register('businessName')}
            error={!!errors.businessName}
            helperText={errors.businessName?.message}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Business Type"
            fullWidth
            size="small"
            {...register('businessType')}
            error={!!errors.businessType}
            helperText={errors.businessType?.message}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Branch Name"
            fullWidth
            size="small"
            {...register('branchName')}
            error={!!errors.branchName}
            helperText={errors.branchName?.message}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Logo URL"
            fullWidth
            size="small"
            {...register('logoUrl')}
            error={!!errors.logoUrl}
            helperText={errors.logoUrl?.message}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Contact Phone"
            fullWidth
            size="small"
            {...register('contactPhone')}
            error={!!errors.contactPhone}
            helperText={errors.contactPhone?.message}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Member Label"
            fullWidth
            size="small"
            {...register('memberLabel')}
            error={!!errors.memberLabel}
            helperText={errors.memberLabel?.message}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Plan Label"
            fullWidth
            size="small"
            {...register('planLabel')}
            error={!!errors.planLabel}
            helperText={errors.planLabel?.message}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Slot Label"
            fullWidth
            size="small"
            {...register('slotLabel')}
            error={!!errors.slotLabel}
            helperText={errors.slotLabel?.message}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Currency Symbol"
            fullWidth
            size="small"
            {...register('currencySymbol')}
            error={!!errors.currencySymbol}
            helperText={errors.currencySymbol?.message}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="Open Time (HH:mm)"
            fullWidth
            size="small"
            {...register('openTime')}
            error={!!errors.openTime}
            helperText={errors.openTime?.message}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="Close Time (HH:mm)"
            fullWidth
            size="small"
            {...register('closeTime')}
            error={!!errors.closeTime}
            helperText={errors.closeTime?.message}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="Slot Duration (minutes)"
            type="number"
            fullWidth
            size="small"
            {...register('slotDurationMinutes', { valueAsNumber: true })}
            error={!!errors.slotDurationMinutes}
            helperText={errors.slotDurationMinutes?.message}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="Nearing Expiry Days"
            type="number"
            fullWidth
            size="small"
            {...register('nearingExpiryDays', { valueAsNumber: true })}
            error={!!errors.nearingExpiryDays}
            helperText={errors.nearingExpiryDays?.message}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            label="Pricing Mode"
            select
            fullWidth
            size="small"
            SelectProps={{ native: true }}
            {...register('pricingMode')}
            error={!!errors.pricingMode}
            helperText={errors.pricingMode?.message}
          >
            <option value="PLAN_ONLY">PLAN_ONLY</option>
            <option value="PLAN_PLUS_SLOT_MULTIPLIER">PLAN_PLUS_SLOT_MULTIPLIER</option>
          </TextField>
        </Grid>
      </Grid>
      <Box mt={2} textAlign="right">
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          Save Settings
        </Button>
      </Box>
    </Box>
  );
}

export default SettingsTab;

