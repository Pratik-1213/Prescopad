import { Router } from 'express';
import * as SyncController from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Push local changes to cloud
router.post('/push', SyncController.push);

// Pull cloud changes since timestamp
router.post('/pull', SyncController.pull);

// Full restore (pull everything)
router.get('/restore', SyncController.restore);

export default router;
