// src/routes/learnerRoutes.js
import express from 'express';
import { registerLearner, loginLearner, logoutLearner } from '../controllers/learnerAuthController.js';
import {
  getMyProfile,
  getCourses,
  enrollInCourse,
  getMyProgress,
  updateProgress,
  getAssessmentDetails,
  submitAssessment,
  getPeers,
  sendMessage,
  getMessages
} from '../controllers/learnerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Public Routes ---
router.post('/auth/register', registerLearner);
router.post('/auth/login', loginLearner);
router.post('/auth/logout', logoutLearner);

// Course discovery (Keeping public as per your comment)
router.get('/courses', getCourses);

// --- Protected Routes (Login Required) ---
router.use(protect);

// Identity & Profile
router.route('/me')
  .get(getMyProfile);

// Progress Management
router.route('/me/progress')
  .get(getMyProgress);

router.route('/me/progress/:courseId')
  .patch(updateProgress);

// Course Interactions
router.route('/courses/:id/enroll')
  .post(enrollInCourse);

// Assessments
router.route('/assessments/:id')
  .get(getAssessmentDetails)
  .post(submitAssessment); // Using .post() for submissions on the same ID path

// Peer Interaction & Messaging
router.route('/peers')
  .get(getPeers);
router.route('/messages')
  .post(sendMessage);
router.route('/messages/:userId')
  .get(getMessages);

export default router;
