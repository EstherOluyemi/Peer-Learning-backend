// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tutor from '../models/Tutor.js';
import { sendError } from './responseHandler.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      return sendError(res, 'Not authorized, token failed', 'NOT_AUTHORIZED', 401);
    }
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token', 'NO_TOKEN', 401);
  }
};

export const tutorOnly = async (req, res, next) => {
  if (req.user && req.user.role === 'tutor') {
    req.tutor = await Tutor.findOne({ userId: req.user._id });
    if (!req.tutor) {
      return sendError(res, 'Tutor profile not found', 'TUTOR_NOT_FOUND', 404);
    }
    next();
  } else {
    return sendError(res, 'Not authorized as a tutor', 'TUTOR_ONLY', 403);
  }
};

export const learnerOnly = async (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return next();
  }
  return sendError(res, 'Not authorized as a learner', 'LEARNER_ONLY', 403);
};
