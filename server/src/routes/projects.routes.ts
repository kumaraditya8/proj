import { Router } from 'express';
import { getProjects, createProject, getProjectDetails, addMember, removeMember } from '../controllers/projects.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', requireRole('admin'), createProject);
router.get('/:id', getProjectDetails);
router.post('/:id/members', requireRole('admin'), addMember);
router.delete('/:id/members/:userId', requireRole('admin'), removeMember);

export default router;
