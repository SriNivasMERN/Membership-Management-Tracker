import express from 'express';
import { listAuditLogs } from '../controllers/auditLogs.controller.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requirePermission('AUDIT_READ'), listAuditLogs);

export default router;
