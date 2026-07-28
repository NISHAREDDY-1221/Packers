import express from 'express';
import { getPrintHistory, printLabels, reprintLabels } from '../controllers/barcodeController';
import { authenticate, requireRoles } from '../middlewares/auth';

const router = express.Router();

router.use(authenticate);

router.get('/history', requireRoles(['ADMIN', 'MANAGER', 'OPERATOR']), getPrintHistory);
router.post('/print', requireRoles(['ADMIN', 'MANAGER', 'OPERATOR']), printLabels);
router.post('/reprint', requireRoles(['ADMIN', 'MANAGER', 'OPERATOR']), reprintLabels);

export default router;
