import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', requirePermission('DASHBOARD_READ'), getDashboardSummary);

export default router;

