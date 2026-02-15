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

const router = express.Router();

router.get('/', listMembers);
router.get('/:id', getMember);
router.post('/', validateRequest(memberBodySchema), createMember);
router.put('/:id', validateRequest(memberBodySchema), updateMember);
router.delete('/:id', deleteMember);

export default router;

