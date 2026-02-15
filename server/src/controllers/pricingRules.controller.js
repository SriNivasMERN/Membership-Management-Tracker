import PricingRule from '../models/PricingRule.js';
import Plan from '../models/Plan.js';
import Slot from '../models/Slot.js';
import { createSuccessResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listPricingRules(req, res) {
  const { planId, slotId } = req.query;
  const query = {};
  if (planId) query.planId = planId;
  if (slotId) query.slotId = slotId;

  const rules = await PricingRule.find(query)
    .populate('planId', 'planName')
    .populate('slotId', 'slotLabel startTime endTime')
    .sort({ createdAt: 1 });

  res.json(createSuccessResponse(rules));
}

export async function createPricingRule(req, res, next) {
  const body = req.validated?.body || req.body;

  // Ensure referenced plan and slot exist
  const plan = await Plan.findById(body.planId);
  if (!plan) {
    return next(new AppError(400, 'Invalid planId'));
  }
  const slot = await Slot.findById(body.slotId);
  if (!slot) {
    return next(new AppError(400, 'Invalid slotId'));
  }

  const rule = await PricingRule.create(body);
  res.status(201).json(createSuccessResponse(rule));
}

export async function updatePricingRule(req, res, next) {
  const { id } = req.params;
  const body = req.validated?.body || req.body;
  const rule = await PricingRule.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!rule) {
    return next(new AppError(404, 'Pricing rule not found'));
  }
  res.json(createSuccessResponse(rule));
}

export async function deletePricingRule(req, res, next) {
  const { id } = req.params;
  const rule = await PricingRule.findByIdAndDelete(id);
  if (!rule) {
    return next(new AppError(404, 'Pricing rule not found'));
  }
  res.json(createSuccessResponse({ deleted: true }));
}

