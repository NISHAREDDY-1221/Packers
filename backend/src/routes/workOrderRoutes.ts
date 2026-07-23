import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as validation from "../validations/workOrder";
import * as controller from "../controllers/workOrderController";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /work-orders:
 *   get:
 *     summary: Get all Work Orders
 *     tags:
 *       - Work Orders
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
 *         description: Work Orders retrieved
 *   post:
 *     summary: Create a Work Order
 *     tags:
 *       - Work Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               recipeId:
 *                 type: string
 *               requiredQty:
 *                 type: number
 *               priority:
 *                 type: string
 *               expectedDate:
 *                 type: string
 *     responses:
 *       201:
 *         description: Work Order created
 */
router
  .route("/")
  .get(controller.getWorkOrders)
  .post(validate(validation.createWorkOrderSchema), controller.createWorkOrder);

/**
 * @openapi
 * /work-orders/{id}/status:
 *   patch:
 *     summary: Update Work Order status
 *     tags:
 *       - Work Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work Order status updated
 */
router.patch(
  "/:id/status",
  validate(validation.updateWorkOrderStatusSchema),
  controller.updateWorkOrderStatus,
);

/**
 * @openapi
 * /work-orders/{id}/issue-materials:
 *   post:
 *     summary: Issue Materials for Work Order
 *     tags:
 *       - Work Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Materials issued successfully
 */
router.post(
  "/:id/issue-materials",
  validate(validation.issueMaterialsSchema),
  controller.issueMaterials,
);

/**
 * @openapi
 * /work-orders/{id}/start-packing:
 *   post:
 *     summary: Start Packing execution and generate Batch
 *     tags:
 *       - Work Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Packing execution started
 */
router.post("/:id/start-packing", controller.startPacking);

/**
 * @openapi
 * /work-orders/{id}/complete-packing:
 *   post:
 *     summary: Complete Packing execution
 *     tags:
 *       - Work Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actualProduced:
 *                 type: number
 *               actualRejected:
 *                 type: number
 *     responses:
 *       200:
 *         description: Packing completed successfully
 */
router.post(
  "/:id/complete-packing",
  validate(validation.completePackingSchema),
  controller.completePacking,
);

export default router;
