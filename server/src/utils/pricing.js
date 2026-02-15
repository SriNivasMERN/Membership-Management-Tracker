import PricingRule from '../models/PricingRule.js';
import Settings from '../models/Settings.js';

export async function getDefaultPriceForPlanAndSlot(plan, slotId) {
  const settings =
    (await Settings.findOne()) ||
    (await Settings.create({}));

  if (settings.pricingMode !== 'PLAN_PLUS_SLOT_MULTIPLIER') {
    return plan.basePrice;
  }

  const rule = await PricingRule.findOne({
    planId: plan._id,
    slotId,
  });

  if (!rule) {
    return plan.basePrice;
  }

  const calculated = plan.basePrice * rule.multiplier;
  return Math.round(calculated * 100) / 100;
}

