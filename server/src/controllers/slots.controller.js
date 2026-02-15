import Slot from '../models/Slot.js';
import Settings from '../models/Settings.js';
import { createSuccessResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import dayjs from 'dayjs';

export async function listSlots(req, res) {
  const includeInactive = req.query.includeInactive === 'true';
  const query = includeInactive ? {} : { isActive: true };
  const slots = await Slot.find(query).sort({ startTime: 1 });
  res.json(createSuccessResponse(slots));
}

export async function getSlot(req, res, next) {
  const { id } = req.params;
  const slot = await Slot.findById(id);
  if (!slot) {
    return next(new AppError(404, 'Slot not found'));
  }
  res.json(createSuccessResponse(slot));
}

export async function createSlot(req, res) {
  const body = req.validated?.body || req.body;
  const slot = await Slot.create(body);
  res.status(201).json(createSuccessResponse(slot));
}

export async function updateSlot(req, res, next) {
  const { id } = req.params;
  const body = req.validated?.body || req.body;
  const slot = await Slot.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!slot) {
    return next(new AppError(404, 'Slot not found'));
  }
  res.json(createSuccessResponse(slot));
}

export async function toggleSlotActive(req, res, next) {
  const { id } = req.params;
  const { isActive } = req.body;
  const slot = await Slot.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true }
  );
  if (!slot) {
    return next(new AppError(404, 'Slot not found'));
  }
  res.json(createSuccessResponse(slot));
}

export async function generateMissingSlots(req, res) {
  const settings =
    (await Settings.findOne()) ||
    (await Settings.create({}));
  const { openTime, closeTime, slotDurationMinutes } = settings;

  const existing = await Slot.find({});
  const existingSet = new Set(
    existing.map((s) => `${s.startTime}-${s.endTime}`)
  );

  const slotsToCreate = [];
  let current = dayjs(openTime, 'HH:mm');
  const end = dayjs(closeTime, 'HH:mm');

  while (current.isBefore(end)) {
    const next = current.add(slotDurationMinutes, 'minute');
    if (next.isAfter(end)) break;
    const startStr = current.format('HH:mm');
    const endStr = next.format('HH:mm');
    const key = `${startStr}-${endStr}`;
    if (!existingSet.has(key)) {
      slotsToCreate.push({
        slotLabel: key,
        startTime: startStr,
        endTime: endStr,
        isActive: true,
      });
    }
    current = next;
  }

  if (slotsToCreate.length) {
    await Slot.insertMany(slotsToCreate);
  }

  const totalSlots = await Slot.countDocuments();

  res.json(
    createSuccessResponse({
      createdCount: slotsToCreate.length,
      totalSlots,
    })
  );
}

