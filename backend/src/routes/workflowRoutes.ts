import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import * as validation from '../validations/workflow';
import * as controller from '../controllers/workflowController';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /workflows/quality-checks:
 *   get:
 *     summary: Get all Quality Checks
 *     tags:
 *       - Workflows
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quality Checks retrieved
 *   post:
 *     summary: Submit a Quality Check
 *     tags:
 *       - Workflows
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               woId:
 *                 type: string
 *               checkedQty:
 *                 type: number
 *               result:
 *                 type: string
 *               severity:
 *                 type: string
 *               failureReason:
 *                 type: string
 *               remarks:
 *                 type: string
 *               checksPayload:
 *                 type: object
 *     responses:
 *       201:
 *         description: Quality Check submitted successfully
 */
router.route('/quality-checks')
  .get(controller.getQualityChecks)
  .post(validate(validation.submitQCSchema), controller.submitQualityCheck);

/**
 * @openapi
 * /workflows/finished-goods:
 *   post:
 *     summary: Post to Finished Goods
 *     tags:
 *       - Workflows
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               woId:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               postedQty:
 *                 type: number
 *               destination:
 *                 type: string
 *     responses:
 *       201:
 *         description: Batch posted to Finished Goods
 */
router.route('/finished-goods')
  .get(controller.getFinishedGoods)
  .post(validate(validation.postFinishedGoodsSchema), controller.postFinishedGoods);

/**
 * @openapi
 * /workflows/repacking:
 *   post:
 *     summary: Log Repacking
 *     tags:
 *       - Workflows
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceWoId:
 *                 type: string
 *               repackType:
 *                 type: string
 *               recoverableQty:
 *                 type: number
 *               wasteQty:
 *                 type: number
 *               targetRecipeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Repacking logged and new Work Order generated
 */
router.route('/repacking')
  .get(controller.getRepacking)
  .post(validate(validation.logRepackingSchema), controller.logRepacking);

export default router;
