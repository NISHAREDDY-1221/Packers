import { Router } from 'express';
import authRoutes from './authRoutes';
import masterRoutes from './masterRoutes';
import workOrderRoutes from './workOrderRoutes';
import workflowRoutes from './workflowRoutes';
import reportRoutes from './reportRoutes';
import approvalRoutes from './approvalRoutes';
import issueRoutes from './issueRoutes';
import barcodeRoutes from './barcodeRoutes';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

router.use('/auth', authRoutes);
router.use('/master-data', masterRoutes);
router.use('/work-orders', workOrderRoutes);
router.use('/workflows', workflowRoutes);
router.use('/reports', reportRoutes);
router.use('/approvals', approvalRoutes);
router.use('/issues', issueRoutes);
router.use('/barcodes', barcodeRoutes);

export default router;
