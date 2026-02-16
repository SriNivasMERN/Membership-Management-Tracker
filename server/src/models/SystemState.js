import mongoose from 'mongoose';

const systemStateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    setupCompleted: { type: Boolean, required: true, default: false },
    setupCompletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const SystemState = mongoose.model('SystemState', systemStateSchema);

export default SystemState;
