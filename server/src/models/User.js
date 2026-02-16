import mongoose from 'mongoose';

export const USER_ROLES = ['ADMIN', 'STAFF', 'VIEWER'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, default: undefined },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true, default: 'STAFF' },
    isActive: { type: Boolean, required: true, default: true },
    mustChangePassword: { type: Boolean, required: true, default: false },
    lastLoginAt: { type: Date, default: null },
    failedLoginCount: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date, default: null },
    tokenVersion: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;
