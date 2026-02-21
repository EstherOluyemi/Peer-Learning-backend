import express from 'express';
import { registerTutor, loginTutor, logoutTutor } from '../controllers/tutorAuthController.js';
import { 
  getMyProfile, 
  updateMyProfile, 
  createSession, 
  getSessions, 
  getSession,
  updateSession, 
  deleteSession,
  getMessages,
  getConversations,
  getMyStudents,
  getStudentProgress,
  getAnalyticsOverview,
  getEarningsAnalytics,
  getReviews,
  respondToReview,
  getReviewAnalytics
} from '../controllers/tutorController.js';

import { protect, tutorOnly } from '../middleware/authMiddleware.js';
const router = express.Router();

// Public routes
router.post('/auth/register', registerTutor);
router.post('/auth/login', loginTutor);
router.post('/auth/logout', logoutTutor);

// Messages
router.get('/messages', getConversations);
router.get('/messages/:userId', getMessages);

// Protected routes (Tutor only)
router.use(protect);

// Auth Me route (Protected but accessible before tutorOnly check if needed, 
router.get('/auth/me', getMyProfile);

router.use(tutorOnly);

router.use(tutorOnly);

// Profile
router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);

// Sessions
router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.patch('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

// Students
router.get('/students', getMyStudents);
router.get('/students/:studentId/progress', getStudentProgress);

// Analytics
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/earnings', getEarningsAnalytics);
router.get('/analytics/reviews', getReviewAnalytics);

// Reviews
router.get('/reviews', getReviews);
router.post('/reviews/:id/respond', respondToReview);

export default router;
