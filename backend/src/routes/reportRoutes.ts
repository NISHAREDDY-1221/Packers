import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import * as controller from "../controllers/reportController";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /reports/yield:
 *   get:
 *     summary: Get Production Yield Report
 *     description: Retrieve a report on production yield, including required vs actual produced/rejected quantities.
 *     tags:
 *       - Reports
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (e.g., 2024-01-01)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (e.g., 2024-12-31)
 *     responses:
 *       200:
 *         description: Production Yield Report generated
 *       400:
 *         description: Missing query parameters
 */
router.get("/yield", controller.getProductionYield);

/**
 * @openapi
 * /reports/qc-summary:
 *   get:
 *     summary: Get QC Summary Report
 *     description: Retrieve a summary of quality check results, grouped by result and severity.
 *     tags:
 *       - Reports
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (e.g., 2024-01-01)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (e.g., 2024-12-31)
 *     responses:
 *       200:
 *         description: QC Summary Report generated
 *       400:
 *         description: Missing query parameters
 */
router.get("/qc-summary", controller.getQcSummary);

export default router;
