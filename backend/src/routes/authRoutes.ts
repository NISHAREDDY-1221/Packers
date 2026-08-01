import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../validations/auth';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User Login
 *     description: Authenticate a user and return a JWT token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 */
/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - roleName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               roleName:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, OPERATOR, QC_INSPECTOR]
 *                 example: MANAGER
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/operators', require('../controllers/authController').getOperators);
router.get('/users', require('../controllers/authController').getUsers);
router.get('/qc-inspectors', require('../controllers/authController').getQCInspectors);

export default router;
