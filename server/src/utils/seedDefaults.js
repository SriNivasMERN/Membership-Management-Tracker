import Settings from '../models/Settings.js';
import Plan from '../models/Plan.js';
import Slot from '../models/Slot.js';
import dayjs from 'dayjs';
import SystemState from '../models/SystemState.js';

export async function ensureDefaultSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

export async function ensureSystemState() {
  let state = await SystemState.findOne({ key: 'INITIAL_SETUP' });
  if (!state) {
    state = await SystemState.create({
      key: 'INITIAL_SETUP',
      setupCompleted: false,
      setupCompletedAt: null,
    });
  }
  return state;
}

export async function seedDefaultPlans() {
  const count = await Plan.countDocuments();
  if (count > 0) return;

  const defaults = [
    { planName: 'Monthly', basePrice: 1000, validityMonths: 1 },
    { planName: 'Quarterly', basePrice: 2000, validityMonths: 3 },
    { planName: 'Half Yearly', basePrice: 5000, validityMonths: 6 },
    { planName: 'Yearly', basePrice: 10000, validityMonths: 12 },
  ];

  await Plan.insertMany(defaults.map((p) => ({ ...p, isActive: true })));
}

export async function seedDefaultSlots() {
  const count = await Slot.countDocuments();
  if (count > 0) return;

  const settings = await ensureDefaultSettings();
  const { openTime, closeTime, slotDurationMinutes } = settings;

  const slotsToCreate = [];
  let current = dayjs(openTime, 'HH:mm');
  const end = dayjs(closeTime, 'HH:mm');

  while (current.isBefore(end)) {
    const next = current.add(slotDurationMinutes, 'minute');
    if (next.isAfter(end)) break;
    const startStr = current.format('HH:mm');
    const endStr = next.format('HH:mm');
    slotsToCreate.push({
      slotLabel: `${startStr}-${endStr}`,
      startTime: startStr,
      endTime: endStr,
      isActive: true,
    });
    current = next;
  }

  if (slotsToCreate.length) {
    await Slot.insertMany(slotsToCreate);
  }
}

