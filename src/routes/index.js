import express from 'express';
import { getHome, getHealth } from '../controllers/homeController.js';
import tutorRoutes from './tutorRoutes.js';
import learnerRoutes from './learnerRoutes.js';

const router = express.Router();

router.get('/', getHome);
router.get('/health', getHealth);

// Tutor routes
router.use('/v1/tutor', tutorRoutes);

// Learner routes
router.use('/v1/learner', learnerRoutes);

export default router;
