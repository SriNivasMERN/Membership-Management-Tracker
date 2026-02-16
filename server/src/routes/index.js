import express from 'express';
import authRouter from './auth.routes.js';
import usersRouter from './users.routes.js';
import auditLogsRouter from './auditLogs.routes.js';
import settingsRouter from './settings.routes.js';
import plansRouter from './plans.routes.js';
import slotsRouter from './slots.routes.js';
import pricingRulesRouter from './pricingRules.routes.js';
import membersRouter from './members.routes.js';
import dashboardRouter from './dashboard.routes.js';
import { requireAuth, requirePasswordChangeResolved } from '../middleware/auth.js';
import { requireCsrfForStateChange } from '../middleware/csrf.js';

const router = express.Router();

router.use('/auth', authRouter);

router.use(requireAuth);
router.use(requireCsrfForStateChange);
router.use(requirePasswordChangeResolved);
router.use('/settings', settingsRouter);
router.use('/plans', plansRouter);
router.use('/slots', slotsRouter);
router.use('/pricing-rules', pricingRulesRouter);
router.use('/members', membersRouter);
router.use('/dashboard', dashboardRouter);
router.use('/users', usersRouter);
router.use('/audit-logs', auditLogsRouter);

export default router;

