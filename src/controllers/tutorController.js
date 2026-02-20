// Fetch a single session by ID
export const getSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, tutorId: req.tutor._id })
      .populate('courseId')
      .populate('studentIds', 'name email');
    if (!session) return sendError(res, 'Session not found', 'SESSION_NOT_FOUND', 404);
    return sendSuccess(res, session);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_SESSION_FAILED', 500);
  }
};
import Tutor from '../models/Tutor.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import { sendSuccess, sendError } from '../middleware/responseHandler.js';

// --- Profile Management ---
export const getMyProfile = async (req, res) => {
  try {
    const tutor = await Tutor.findOne({ userId: req.user._id }).populate('userId', 'name email role');
    return sendSuccess(res, tutor);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_PROFILE_FAILED', 500);
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { bio, subjects, hourlyRate, availability } = req.body;
    const tutor = await Tutor.findOneAndUpdate(
      { userId: req.user._id },
      { bio, subjects, hourlyRate, availability },
      { new: true, runValidators: true }
    );
    return sendSuccess(res, tutor);
  } catch (error) {
    return sendError(res, error.message, 'UPDATE_PROFILE_FAILED', 500);
  }
};

// --- Session Scheduling ---
export const createSession = async (req, res) => {
  try {
    const { title, subject, courseId, startTime, endTime, meetingLink, maxParticipants } = req.body;
    const session = await Session.create({
      title,
      subject,
      courseId,
      tutorId: req.tutor._id,
      startTime,
      endTime,
      meetingLink,
      maxParticipants
    });
    return sendSuccess(res, session, 201);
  } catch (error) {
    return sendError(res, error.message, 'CREATE_SESSION_FAILED', 500);
  }
};

export const getSessions = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = { tutorId: req.tutor._id };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query).populate('courseId').populate('studentIds', 'name email');
    return sendSuccess(res, sessions);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_SESSIONS_FAILED', 500);
  }
};

export const updateSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, tutorId: req.tutor._id });
    if (!session) return sendError(res, 'Session not found', 'SESSION_NOT_FOUND', 404);
    Object.keys(req.body).forEach(key => {
      session[key] = req.body[key];
    });
    await session.save();
    return sendSuccess(res, session);
  } catch (error) {
    return sendError(res, error.message, 'UPDATE_SESSION_FAILED', 500);
  }
};

export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, tutorId: req.tutor._id });
    if (!session) return sendError(res, 'Session not found', 'SESSION_NOT_FOUND', 404);
    
    if (session.studentIds.length > 0) {
      return sendError(res, 'Cannot delete session with enrolled students', 'DELETE_SESSION_RESTRICTED', 400);
    }

    await session.deleteOne();
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error.message, 'DELETE_SESSION_FAILED', 500);
  }
};

// --- Student Management ---
export const getMyStudents = async (req, res) => {
  try {
    const sessions = await Session.find({ tutorId: req.tutor._id }).populate('studentIds', 'name email');
    const studentsMap = new Map();
    
    sessions.forEach(session => {
      session.studentIds.forEach(student => {
        studentsMap.set(student._id.toString(), student);
      });
    });

    return sendSuccess(res, Array.from(studentsMap.values()));
  } catch (error) {
    return sendError(res, error.message, 'FETCH_STUDENTS_FAILED', 500);
  }
};

export const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const sessions = await Session.find({ 
      tutorId: req.tutor._id, 
      studentIds: studentId 
    }).populate('courseId');
    
    return sendSuccess(res, {
      studentId,
      sessionHistory: sessions,
      totalSessions: sessions.length
    });
  } catch (error) {
    return sendError(res, error.message, 'FETCH_PROGRESS_FAILED', 500);
  }
};

// --- Performance Analytics ---
export const getAnalyticsOverview = async (req, res) => {
  try {
    const totalEarnings = req.tutor.earnings;
    const activeSessions = await Session.countDocuments({ tutorId: req.tutor._id, status: 'scheduled' });
    
    const sessions = await Session.find({ tutorId: req.tutor._id });
    const studentsSet = new Set();
    sessions.forEach(s => s.studentIds.forEach(id => studentsSet.add(id.toString())));

    return sendSuccess(res, {
      totalEarnings,
      activeSessions,
      totalStudents: studentsSet.size,
      avgRating: req.tutor.rating
    });
  } catch (error) {
    return sendError(res, error.message, 'FETCH_ANALYTICS_FAILED', 500);
  }
};

export const getEarningsAnalytics = async (req, res) => {
  try {
    const payments = await Payment.find({ tutorId: req.tutor._id, type: 'credit', status: 'completed' });
    return sendSuccess(res, payments);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_EARNINGS_FAILED', 500);
  }
};

// --- Reviews & Feedback ---
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.tutor._id }).populate('studentId', 'name');
    return sendSuccess(res, reviews);
  } catch (error) {
    return sendError(res, error.message, 'FETCH_REVIEWS_FAILED', 500);
  }
};

export const respondToReview = async (req, res) => {
  try {
    const { responseText } = req.body;
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, tutorId: req.tutor._id },
      { responseText },
      { new: true }
    );
    if (!review) return sendError(res, 'Review not found', 'REVIEW_NOT_FOUND', 404);
    return sendSuccess(res, review);
  } catch (error) {
    return sendError(res, error.message, 'RESPOND_REVIEW_FAILED', 500);
  }
};

export const getReviewAnalytics = async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.tutor._id });
    // Simple sentiment counting for demonstration
    const sentiment = {
      positive: reviews.filter(r => r.rating >= 4).length,
      neutral: reviews.filter(r => r.rating === 3).length,
      negative: reviews.filter(r => r.rating <= 2).length,
    };
    return sendSuccess(res, { reviews, sentiment });
  } catch (error) {
    return sendError(res, error.message, 'FETCH_REVIEW_ANALYTICS_FAILED', 500);
  }
};
