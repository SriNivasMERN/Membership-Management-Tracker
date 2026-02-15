import mongoose from 'mongoose';

const pricingRuleSchema = new mongoose.Schema(
  {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    multiplier: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

pricingRuleSchema.index({ planId: 1, slotId: 1 }, { unique: true });

const PricingRule = mongoose.model('PricingRule', pricingRuleSchema);

export default PricingRule;

