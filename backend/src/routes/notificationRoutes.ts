import { Router } from 'express';
import { getNotifications, markAsRead, clearNotifications } from '../controllers/notificationController';
import { authenticate, optionalAuth } from '../middlewares/auth';

const router = Router();

router.get('/', optionalAuth, getNotifications);
router.patch('/:id/read', optionalAuth, markAsRead);
router.delete('/', optionalAuth, clearNotifications);

export default router;
