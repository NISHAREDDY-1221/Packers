import { Router } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import * as validation from '../validations/master';
import * as controller from '../controllers/masterController';

const router = Router();

// Protect all master data routes for ADMIN only
router.use(authenticate);
router.use(requireRoles(['ADMIN']));

/**
 * @openapi
 * /master-data/categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Master Data
 *     responses:
 *       200:
 *         description: Categories retrieved
 *   post:
 *     summary: Create a category
 *     tags:
 *       - Master Data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 */
router.route('/categories')
  .get(controller.getCategories)
  .post(validate(validation.createCategorySchema), controller.createCategory);

router.route('/categories/:id')
  .put(validate(validation.updateCategorySchema), controller.updateCategory)
  .patch(controller.toggleCategoryStatus)
  .delete(controller.deleteCategory);

/**
 * @openapi
 * /master-data/uom:
 *   get:
 *     summary: Get all Units of Measure
 *     tags:
 *       - Master Data
 *     responses:
 *       200:
 *         description: UOMs retrieved
 *   post:
 *     summary: Create a Unit of Measure
 *     tags:
 *       - Master Data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               abbreviation:
 *                 type: string
 *     responses:
 *       201:
 *         description: UOM created
 */
router.route('/uom')
  .get(controller.getUOMs)
  .post(validate(validation.createUOMSchema), controller.createUOM);

router.route('/uom/:id')
  .put(validate(validation.updateUOMSchema), controller.updateUOM)
  .patch(controller.toggleUOMStatus)
  .delete(controller.deleteUOM);

/**
 * @openapi
 * /master-data/products:
 *   get:
 *     summary: Get all Products
 *     tags:
 *       - Master Data
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
 *         description: Products retrieved
 *   post:
 *     summary: Create a Product
 *     tags:
 *       - Master Data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *               name:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               uomId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created
 */
router.route('/products')
  .get(controller.getProducts)
  .post(validate(validation.createProductSchema), controller.createProduct);

router.route('/products/:id')
  .put(validate(validation.updateProductSchema), controller.updateProduct)
  .patch(controller.toggleProductStatus)
  .delete(controller.deleteProduct);

/**
 * @openapi
 * /master-data/warehouses:
 *   get:
 *     summary: Get all Warehouses
 *     tags:
 *       - Master Data
 *     responses:
 *       200:
 *         description: Warehouses retrieved
 *   post:
 *     summary: Create a Warehouse
 *     tags:
 *       - Master Data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Warehouse created
 */
router.route('/warehouses')
  .get(controller.getWarehouses)
  .post(validate(validation.createWarehouseSchema), controller.createWarehouse);

router.route('/warehouses/:id')
  .put(validate(validation.updateWarehouseSchema), controller.updateWarehouse)
  .patch(controller.toggleWarehouseStatus)
  .delete(controller.deleteWarehouse);

/**
 * @openapi
 * /master-data/recipes:
 *   get:
 *     summary: Get all Recipes (BOM)
 *     tags:
 *       - Master Data
 *     responses:
 *       200:
 *         description: Recipes retrieved
 *   post:
 *     summary: Create a Recipe (BOM)
 *     tags:
 *       - Master Data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               version:
 *                 type: string
 *               components:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Recipe created
 */
router.route('/recipes')
  .get(controller.getRecipes)
  .post(validate(validation.createRecipeSchema), controller.createRecipe);

export default router;
