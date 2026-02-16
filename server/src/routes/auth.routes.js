import express from 'express';
import {
  completeSetup,
  changePassword,
  login,
  logout,
  me,
  resetPassword,
  refresh,
  setupStatus,
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  changePasswordSchema,
  loginSchema,
  resetPasswordSchema,
  setupSchema,
} from '../validation/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { loginEmailLimiter, loginIpLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/setup-status', setupStatus);
router.post('/setup', validateRequest(setupSchema), completeSetup);
router.post('/login', loginIpLimiter, loginEmailLimiter, validateRequest(loginSchema), login);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.post('/refresh', requireCsrf, refresh);
router.post('/logout', requireCsrf, logout);
router.get('/me', requireAuth, me);
router.post(
  '/change-password',
  requireAuth,
  requireCsrf,
  validateRequest(changePasswordSchema),
  changePassword
);

export default router;
