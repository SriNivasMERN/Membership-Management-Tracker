import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    slotLabel: { type: String, required: true, unique: true, trim: true },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

slotSchema.index({ slotLabel: 1 }, { unique: true });
slotSchema.index({ startTime: 1, endTime: 1 }, { unique: true });
slotSchema.index({ isActive: 1 });

const Slot = mongoose.model('Slot', slotSchema);

export default Slot;

