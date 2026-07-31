import express from 'express';
import { getPrintHistory, printLabels, reprintLabels, getMyTasks, completeLabelTask } from '../controllers/barcodeController';
import { authenticate, requireRoles } from '../middlewares/auth';

const router = express.Router();

router.use(authenticate);

router.get('/history', requireRoles(['ADMIN', 'MANAGER', 'OPERATOR']), getPrintHistory);
router.post('/print', requireRoles(['ADMIN', 'MANAGER', 'OPERATOR']), printLabels);
router.post('/reprint', requireRoles(['ADMIN', 'MANAGER', 'OPERATOR']), reprintLabels);
router.get('/my-tasks', requireRoles(['OPERATOR']), getMyTasks);
router.post('/complete-task', requireRoles(['OPERATOR']), completeLabelTask);

export default router;
