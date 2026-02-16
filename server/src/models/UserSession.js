import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true },
    refreshTokenHash: { type: String, required: true, index: true },
    createdAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null, index: true },
    lastUsedAt: { type: Date, default: null },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

userSessionSchema.index({ userId: 1, revokedAt: 1 });

const UserSession = mongoose.model('UserSession', userSessionSchema);

export default UserSession;
