import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorRole: { type: String, default: null },
    actionType: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, default: null },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    createdAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: false }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
