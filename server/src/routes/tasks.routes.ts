import { Router } from 'express';
import { getTasks, createTask, updateTaskStatus } from '../controllers/tasks.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', requireRole('admin'), createTask);
router.put('/:id/status', updateTaskStatus);

export default router;
