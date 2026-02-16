import express from 'express';
import {
  createUser,
  deactivateUser,
  listUsers,
  resetUserPassword,
  updateUser,
} from '../controllers/users.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createUserSchema, issueResetCodeSchema, updateUserSchema } from '../validation/auth.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requirePermission('USERS_MANAGE'), listUsers);
router.post('/', requirePermission('USERS_MANAGE'), validateRequest(createUserSchema), createUser);
router.put('/:id', requirePermission('USERS_MANAGE'), validateRequest(updateUserSchema), updateUser);
router.patch('/:id/deactivate', requirePermission('USERS_MANAGE'), deactivateUser);
router.post(
  '/:id/reset-password',
  requirePermission('USERS_MANAGE'),
  validateRequest(issueResetCodeSchema),
  resetUserPassword
);

export default router;
