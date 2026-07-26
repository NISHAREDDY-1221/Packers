import { Router } from 'express';
import { reportIssue } from '../controllers/issueController';
// import { authenticate } from '../middleware/auth'; // assume it exists if needed

const router = Router();

// Define routes
router.post('/', reportIssue);

export default router;
