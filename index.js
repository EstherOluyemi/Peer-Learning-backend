import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import routes from './src/routes/index.js';
import { logger, errorHandler } from './src/middleware/errorMiddleware.js';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './src/docs/openapi.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Routes
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Root route
app.get('/', (req, res) => {
  res.redirect('/api');
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
