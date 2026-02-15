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

const imageValueSchema = z
  .string()
  .refine(
    (value) => {
      if (!value) return true;
      if (z.string().url().safeParse(value).success) return true;
      return value.startsWith('data:image/');
    },
    'Must be a valid image URL or uploaded image data'
  );

const schema = z.object({
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  branchName: z.string().min(1),
  logoUrl: imageValueSchema.optional().or(z.literal('')),
  menuImageUrl: imageValueSchema.optional().or(z.literal('')),
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
  const logoUploadRef = React.useRef(null);
  const menuImageUploadRef = React.useRef(null);
  const [uploadingField, setUploadingField] = React.useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: settings || {},
  });
  const logoValue = watch('logoUrl') || '';
  const menuImageValue = watch('menuImageUrl') || '';

  React.useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (values) => {
    const updated = await api.put('/settings', values);
    setSettings(updated);
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const loadImage = (dataUrl) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });

  const optimizeImage = async (file) => {
    const sourceDataUrl = await fileToDataUrl(file);
    const img = await loadImage(sourceDataUrl);
    const maxSide = 900;
    const longSide = Math.max(img.width, img.height);
    const scale = Math.min(1, maxSide / longSide);
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return sourceDataUrl;
    }
    ctx.drawImage(img, 0, 0, width, height);

    const trimCanvas = (inputCanvas) => {
      const inputCtx = inputCanvas.getContext('2d');
      if (!inputCtx) return inputCanvas;
      const { width: w, height: h } = inputCanvas;
      const imageData = inputCtx.getImageData(0, 0, w, h).data;

      let top = h;
      let left = w;
      let right = 0;
      let bottom = 0;
      let found = false;

      const isNotBlank = (r, g, b, a) => {
        if (a > 16) return true;
        // Treat near-white pixels as blank edge background while trimming.
        return !(r > 245 && g > 245 && b > 245);
      };

      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const idx = (y * w + x) * 4;
          const r = imageData[idx];
          const g = imageData[idx + 1];
          const b = imageData[idx + 2];
          const a = imageData[idx + 3];
          if (isNotBlank(r, g, b, a)) {
            found = true;
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
          }
        }
      }

      if (!found) return inputCanvas;

      const pad = 4;
      left = Math.max(0, left - pad);
      top = Math.max(0, top - pad);
      right = Math.min(w - 1, right + pad);
      bottom = Math.min(h - 1, bottom + pad);

      const outW = right - left + 1;
      const outH = bottom - top + 1;
      if (outW <= 0 || outH <= 0) return inputCanvas;

      const out = document.createElement('canvas');
      out.width = outW;
      out.height = outH;
      const outCtx = out.getContext('2d');
      if (!outCtx) return inputCanvas;
      outCtx.drawImage(inputCanvas, left, top, outW, outH, 0, 0, outW, outH);
      return out;
    };

    const trimmedCanvas = trimCanvas(canvas);

    let optimized = trimmedCanvas.toDataURL('image/webp', 0.86);
    if (optimized.length > 260000) {
      optimized = trimmedCanvas.toDataURL('image/jpeg', 0.82);
    }
    return optimized;
  };

  const handleLocalImageUpload = (field) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(field, { type: 'manual', message: 'Please select a valid image file.' });
      event.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError(field, {
        type: 'manual',
        message: 'Image is too large. Please select an image smaller than 8 MB.',
      });
      event.target.value = '';
      return;
    }

    try {
      setUploadingField(field);
      const optimized = await optimizeImage(file);
      if (optimized.length > 350000) {
        setError(field, {
          type: 'manual',
          message: 'Image is still too large after optimization. Please choose a smaller image.',
        });
      } else {
        clearErrors(field);
        setValue(field, optimized, { shouldDirty: true, shouldValidate: true });
      }
    } catch {
      setError(field, {
        type: 'manual',
        message: 'Unable to process this image. Please try another file.',
      });
    } finally {
      setUploadingField('');
      // reset so selecting the same file again still triggers change
      event.target.value = '';
    }
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
            label="Contact Phone"
            fullWidth
            size="small"
            {...register('contactPhone')}
            error={!!errors.contactPhone}
            helperText={errors.contactPhone?.message}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Logo URL"
            fullWidth
            size="small"
            value={logoValue.startsWith('data:image/') ? '' : logoValue}
            onChange={(e) =>
              setValue('logoUrl', e.target.value, { shouldDirty: true, shouldValidate: true })
            }
            placeholder="https://example.com/logo.png"
            error={!!errors.logoUrl}
            helperText={
              errors.logoUrl?.message ||
              (logoValue.startsWith('data:image/') ? 'Local logo image selected.' : '')
            }
          />
          <Box mt={1}>
            <input
              ref={logoUploadRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLocalImageUpload('logoUrl')}
            />
            <Button
              type="button"
              variant="outlined"
              size="small"
              disabled={uploadingField === 'logoUrl'}
              onClick={() => logoUploadRef.current?.click()}
            >
              {uploadingField === 'logoUrl' ? 'Processing...' : 'Upload Logo'}
            </Button>
            {logoValue.startsWith('data:image/') ? (
              <Button
                type="button"
                variant="text"
                size="small"
                color="inherit"
                sx={{ ml: 1 }}
                onClick={() =>
                  setValue('logoUrl', '', { shouldDirty: true, shouldValidate: true })
                }
              >
                Clear
              </Button>
            ) : null}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Menu Image URL"
            fullWidth
            size="small"
            value={menuImageValue.startsWith('data:image/') ? '' : menuImageValue}
            onChange={(e) =>
              setValue('menuImageUrl', e.target.value, { shouldDirty: true, shouldValidate: true })
            }
            placeholder="https://example.com/menu-image.jpg"
            error={!!errors.menuImageUrl}
            helperText={
              errors.menuImageUrl?.message ||
              (menuImageValue.startsWith('data:image/')
                ? 'Local menu image selected.'
                : '')
            }
          />
          <Box mt={1}>
            <input
              ref={menuImageUploadRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleLocalImageUpload('menuImageUrl')}
            />
            <Button
              type="button"
              variant="outlined"
              size="small"
              disabled={uploadingField === 'menuImageUrl'}
              onClick={() => menuImageUploadRef.current?.click()}
            >
              {uploadingField === 'menuImageUrl' ? 'Processing...' : 'Upload Menu Image'}
            </Button>
            {menuImageValue.startsWith('data:image/') ? (
              <Button
                type="button"
                variant="text"
                size="small"
                color="inherit"
                sx={{ ml: 1 }}
                onClick={() =>
                  setValue('menuImageUrl', '', { shouldDirty: true, shouldValidate: true })
                }
              >
                Clear
              </Button>
            ) : null}
          </Box>
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

