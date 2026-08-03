import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/error';
import routes from './routes';
import { logger } from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', routes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Cannot find ${req.originalUrl} on this server!` });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
