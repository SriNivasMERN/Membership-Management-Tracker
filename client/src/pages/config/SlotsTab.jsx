import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axiosClient.js';
import { useSettings } from '../../context/SettingsContext.jsx';

const schema = z
  .object({
    slotLabel: z.string().min(1),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    path: ['startTime'],
    message: 'Start time must be before end time',
  });

function SlotFormDialog({ open, onClose, initialData, onSaved }) {
  const isEdit = Boolean(initialData);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      slotLabel: '',
      startTime: '05:00',
      endTime: '06:00',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({ slotLabel: '', startTime: '05:00', endTime: '06:00' });
    }
  }, [initialData, reset]);

  const onSubmit = async (values) => {
    if (isEdit) {
      await api.put(`/slots/${initialData._id}`, values);
    } else {
      await api.post('/slots', values);
    }
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Slot' : 'Add Slot'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Slot Label"
            size="small"
            {...register('slotLabel')}
            error={!!errors.slotLabel}
            helperText={errors.slotLabel?.message}
          />
          <TextField
            label="Start Time (HH:mm)"
            size="small"
            {...register('startTime')}
            error={!!errors.startTime}
            helperText={errors.startTime?.message}
          />
          <TextField
            label="End Time (HH:mm)"
            size="small"
            {...register('endTime')}
            error={!!errors.endTime}
            helperText={errors.endTime?.message}
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

function SlotsTab() {
  const { settings } = useSettings();
  const [slots, setSlots] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const loadSlots = async () => {
    const data = await api.get('/slots', { params: { includeInactive: true } });
    setSlots(data);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const openCreate = () => {
    setEditingSlot(null);
    setDialogOpen(true);
  };

  const openEdit = (slot) => {
    setEditingSlot(slot);
    setDialogOpen(true);
  };

  const toggleActive = async (slot) => {
    await api.patch(`/slots/${slot._id}/deactivate`, { isActive: !slot.isActive });
    loadSlots();
  };

  const generateMissing = async () => {
    await api.post('/slots/generate-missing');
    loadSlots();
  };

  return (
    <Box>
      <Box mb={1} display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
        <Button
          startIcon={<AutoAwesomeIcon />}
          variant="outlined"
          size="small"
          onClick={generateMissing}
        >
          Generate Missing Slots
        </Button>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={openCreate}
        >
          {`Add ${settings?.slotLabel || 'Slot'}`}
        </Button>
      </Box>
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Label</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slots.map((slot) => (
                <TableRow key={slot._id} hover>
                  <TableCell>{slot.slotLabel}</TableCell>
                  <TableCell>{slot.startTime}</TableCell>
                  <TableCell>{slot.endTime}</TableCell>
                  <TableCell>
                    {slot.isActive ? (
                      <Chip label="Active" size="small" color="success" />
                    ) : (
                      <Chip label="Inactive" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(slot)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => toggleActive(slot)}>
                      {slot.isActive ? (
                        <ToggleOffIcon fontSize="small" />
                      ) : (
                        <ToggleOnIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {slots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No slots found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <SlotFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={editingSlot}
        onSaved={loadSlots}
      />
    </Box>
  );
}

export default SlotsTab;

