import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, default: 'My Fitness Studio' },
    businessType: { type: String, required: true, default: 'Gym' },
    branchName: { type: String, required: true, default: 'Main Branch' },
    logoUrl: { type: String },
    menuImageUrl: { type: String },
    contactPhone: { type: String },
    memberLabel: { type: String, required: true, default: 'Member' },
    planLabel: { type: String, required: true, default: 'Plan' },
    slotLabel: { type: String, required: true, default: 'Slot' },
    currencySymbol: { type: String, required: true, default: '₹' },
    openTime: { type: String, required: true, default: '05:00' },
    closeTime: { type: String, required: true, default: '21:00' },
    slotDurationMinutes: { type: Number, required: true, default: 60, min: 1 },
    nearingExpiryDays: { type: Number, required: true, default: 7, min: 0 },
    pricingMode: {
      type: String,
      enum: ['PLAN_ONLY', 'PLAN_PLUS_SLOT_MULTIPLIER'],
      required: true,
      default: 'PLAN_ONLY',
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;

