import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { optionalAuth } from '../middlewares/auth';

const router = Router();

router.get('/', optionalAuth, getSettings);
router.put('/', optionalAuth, updateSettings);

export default router;
