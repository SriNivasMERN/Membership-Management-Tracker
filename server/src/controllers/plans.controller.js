import Plan from '../models/Plan.js';
import { createSuccessResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listPlans(req, res) {
  const includeInactive = req.query.includeInactive === 'true';
  const query = includeInactive ? {} : { isActive: true };
  const plans = await Plan.find(query).sort({ createdAt: 1 });
  res.json(createSuccessResponse(plans));
}

export async function getPlan(req, res, next) {
  const { id } = req.params;
  const plan = await Plan.findById(id);
  if (!plan) {
    return next(new AppError(404, 'Plan not found'));
  }
  res.json(createSuccessResponse(plan));
}

export async function createPlan(req, res) {
  const body = req.validated?.body || req.body;
  const plan = await Plan.create(body);
  res.status(201).json(createSuccessResponse(plan));
}

export async function updatePlan(req, res, next) {
  const { id } = req.params;
  const body = req.validated?.body || req.body;
  const plan = await Plan.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!plan) {
    return next(new AppError(404, 'Plan not found'));
  }
  res.json(createSuccessResponse(plan));
}

export async function togglePlanActive(req, res, next) {
  const { id } = req.params;
  const { isActive } = req.body;
  const plan = await Plan.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true }
  );
  if (!plan) {
    return next(new AppError(404, 'Plan not found'));
  }
  res.json(createSuccessResponse(plan));
}

