import express from 'express';
import { getHome, getHealth } from '../controllers/homeController.js';
import tutorRoutes from './tutorRoutes.js';
import learnerRoutes from './learnerRoutes.js';
import chatRoutes from './chatRoutes.js';

const router = express.Router();

router.get('/', getHome);
router.get('/health', getHealth);

// Tutor routes
router.use('/v1/tutor', tutorRoutes);

// Learner routes
router.use('/v1/learner', learnerRoutes);

// Chat routes (both roles)
router.use('/v1/chat', chatRoutes);

export default router;
