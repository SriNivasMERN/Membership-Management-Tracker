import dayjs from 'dayjs';
import Member from '../models/Member.js';
import Plan from '../models/Plan.js';
import Slot from '../models/Slot.js';
import Settings from '../models/Settings.js';
import { createSuccessResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { paginationQuerySchema } from '../validation/common.js';

export async function listMembers(req, res, next) {
  const parseResult = paginationQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return next(
      new AppError(400, 'Validation error', {
        query: 'Invalid pagination parameters',
      })
    );
  }
  const { page, limit, q, status } = parseResult.data;

  const filter = {};
  if (q && q.trim() !== '') {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{ name: regex }, { mobile: regex }];
  }
  if (status && status !== 'all') {
    const today = dayjs().startOf('day');
    if (status === 'active') {
      filter.endDate = { $gte: today.toDate() };
    } else if (status === 'inactive') {
      filter.endDate = { $lt: today.toDate() };
    } else if (status === 'nearing') {
      const settings =
        (await Settings.findOne()) ||
        (await Settings.create({}));
      const nearingExpiryLimit = today
        .add(settings.nearingExpiryDays, 'day')
        .endOf('day');
      filter.endDate = {
        $gte: today.toDate(),
        $lte: nearingExpiryLimit.toDate(),
      };
    } else if (status === 'activeNow') {
      const currentTime = dayjs().format('HH:mm');
      filter.endDate = { $gte: today.toDate() };
      filter['slotSnapshot.startTime'] = { $lte: currentTime };
      filter['slotSnapshot.endTime'] = { $gt: currentTime };
    }
  }

  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    Member.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Member.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 1;

  res.json(
    createSuccessResponse({
      items,
      pagination: { page, limit, totalItems, totalPages },
    })
  );
}

async function buildSnapshotsAndSave(member, body) {
  const plan = await Plan.findById(body.selectedPlanId);
  if (!plan) {
    throw new AppError(400, 'Invalid selectedPlanId');
  }
  const slot = await Slot.findById(body.selectedSlotId);
  if (!slot) {
    throw new AppError(400, 'Invalid selectedSlotId');
  }

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);

  member.name = body.name;
  member.mobile = body.mobile;
  member.email = body.email || undefined;
  member.selectedPlanId = plan._id;
  member.selectedSlotId = slot._id;
  member.startDate = startDate;
  member.endDate = endDate;
  member.price = body.price;
  member.fullyPaid = body.fullyPaid;
  member.pendingAmount = body.pendingAmount;
  member.notes = body.notes;

  // Snapshot current plan and slot and final price
  member.planSnapshot = {
    planId: plan._id,
    planName: plan.planName,
    basePrice: plan.basePrice,
    validityMonths: plan.validityMonths,
  };
  member.slotSnapshot = {
    slotId: slot._id,
    slotLabel: slot.slotLabel,
    startTime: slot.startTime,
    endTime: slot.endTime,
  };
  member.finalPrice = body.price;

  await member.save();
  return member;
}

export async function createMember(req, res, next) {
  const body = req.validated?.body || req.body;
  const member = new Member();
  const saved = await buildSnapshotsAndSave(member, body);
  res.status(201).json(createSuccessResponse(saved));
}

export async function getMember(req, res, next) {
  const { id } = req.params;
  const member = await Member.findById(id);
  if (!member) {
    return next(new AppError(404, 'Member not found'));
  }
  res.json(createSuccessResponse(member));
}

export async function updateMember(req, res, next) {
  const { id } = req.params;
  const body = req.validated?.body || req.body;
  const member = await Member.findById(id);
  if (!member) {
    return next(new AppError(404, 'Member not found'));
  }
  const saved = await buildSnapshotsAndSave(member, body);
  res.json(createSuccessResponse(saved));
}

export async function deleteMember(req, res, next) {
  const { id } = req.params;
  const member = await Member.findByIdAndDelete(id);
  if (!member) {
    return next(new AppError(404, 'Member not found'));
  }
  res.json(createSuccessResponse({ deleted: true }));
}

