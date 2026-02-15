import mongoose from 'mongoose';

const planSnapshotSchema = new mongoose.Schema(
  {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    planName: { type: String, required: true },
    basePrice: { type: Number, required: true },
    validityMonths: { type: Number, required: true },
  },
  { _id: false }
);

const slotSnapshotSchema = new mongoose.Schema(
  {
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    slotLabel: { type: String, required: true },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
  },
  { _id: false }
);

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    selectedPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    selectedSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    fullyPaid: { type: Boolean, required: true },
    pendingAmount: { type: Number, required: true, min: 0 },
    planSnapshot: { type: planSnapshotSchema, required: true },
    slotSnapshot: { type: slotSnapshotSchema, required: true },
    finalPrice: { type: Number, required: true, min: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

memberSchema.index({ mobile: 1 });
memberSchema.index({ name: 1 });
memberSchema.index({ endDate: 1 });
memberSchema.index({ startDate: 1 });
memberSchema.index({ 'slotSnapshot.startTime': 1, 'slotSnapshot.endTime': 1 });

const Member = mongoose.model('Member', memberSchema);

export default Member;

