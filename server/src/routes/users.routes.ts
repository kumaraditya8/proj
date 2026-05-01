import { Router } from 'express';
import { getUsers } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);

export default router;
