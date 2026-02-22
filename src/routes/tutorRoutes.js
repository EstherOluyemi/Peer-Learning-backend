// src/routes/tutorRoutes.js
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
  sendMessage,
  getMyStudents,
  getStudentProgress,
  getAnalyticsOverview,
  getEarningsAnalytics,
  getReviews,
  respondToReview,
  getReviewAnalytics
} from '../controllers/tutorController.js';
import { createMeeting } from '../controllers/googleMeetController.js';

import { protect, tutorOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Public Routes ---
router.post('/auth/register', registerTutor);
router.post('/auth/login', loginTutor);
router.post('/auth/logout', logoutTutor);

// --- Protected Routes (Must be Logged In) ---
router.use(protect);

// Messaging
router.route('/messages')
  .get(getConversations)
  .post(sendMessage);
router.route('/messages/:userId')
  .get(getMessages);

// --- Tutor Exclusive Routes ---
router.use(tutorOnly);

router.post('/google-meet/create-meeting', createMeeting);

// Profile
router.route('/me')
  .get(getMyProfile)
  .patch(updateMyProfile);

// Sessions
router.route('/sessions')
  .get(getSessions)
  .post(createSession);

router.route('/sessions/:id')
  .get(getSession)
  .patch(updateSession)
  .delete(deleteSession);

// Students
router.route('/students')
  .get(getMyStudents);
router.route('/students/:studentId/progress')
  .get(getStudentProgress);

// Analytics
router.route('/analytics/overview')
  .get(getAnalyticsOverview);
router.route('/analytics/earnings')
  .get(getEarningsAnalytics);
router.route('/analytics/reviews')
  .get(getReviewAnalytics);

// --- Tutor Exclusive Routes ---
// Reviews
router.route('/reviews')
  .get(getReviews);
router.route('/reviews/:id/respond')
  .post(respondToReview);

export default router;
