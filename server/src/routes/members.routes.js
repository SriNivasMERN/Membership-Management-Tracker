import express from 'express';
import {
  listMembers,
  createMember,
  getMember,
  updateMember,
  deleteMember,
} from '../controllers/members.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { memberBodySchema } from '../validation/member.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requirePermission('MEMBERS_READ'), listMembers);
router.get('/:id', requirePermission('MEMBERS_READ'), getMember);
router.post('/', requirePermission('MEMBERS_WRITE'), validateRequest(memberBodySchema), createMember);
router.put('/:id', requirePermission('MEMBERS_WRITE'), validateRequest(memberBodySchema), updateMember);
router.delete('/:id', requirePermission('MEMBERS_WRITE'), deleteMember);

export default router;

