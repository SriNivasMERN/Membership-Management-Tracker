import express from 'express';
import settingsRouter from './settings.routes.js';
import plansRouter from './plans.routes.js';
import slotsRouter from './slots.routes.js';
import pricingRulesRouter from './pricingRules.routes.js';
import membersRouter from './members.routes.js';
import dashboardRouter from './dashboard.routes.js';

const router = express.Router();

router.use('/settings', settingsRouter);
router.use('/plans', plansRouter);
router.use('/slots', slotsRouter);
router.use('/pricing-rules', pricingRulesRouter);
router.use('/members', membersRouter);
router.use('/dashboard', dashboardRouter);

export default router;

