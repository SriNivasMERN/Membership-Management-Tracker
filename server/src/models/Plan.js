import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true, unique: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    validityMonths: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

planSchema.index({ planName: 1 }, { unique: true });
planSchema.index({ isActive: 1 });

const Plan = mongoose.model('Plan', planSchema);

export default Plan;

