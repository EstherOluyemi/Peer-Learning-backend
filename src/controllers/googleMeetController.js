import {
  createGoogleMeetMeeting,
  getOrCreatePermanentGoogleMeetLink,
  getGoogleOAuthUrl,
  getGoogleOAuthStatus,
  refreshGoogleOAuth,
  revokeGoogleOAuth
} from '../services/googleMeetService.js';
import { sendSuccess, sendError } from '../middleware/responseHandler.js';

export const createMeeting = async (req, res) => {
  try {
    const { tutorId, studentId, scheduledTime, meetingTitle, durationMinutes } = req.body;
    const missingFields = ['tutorId', 'studentId', 'scheduledTime', 'meetingTitle'].filter(
      (field) => !req.body[field]
    );

    if (missingFields.length > 0) {
      return sendError(res, `Missing required fields: ${missingFields.join(', ')}`, 'MISSING_FIELDS', 400);
    }

    if (req.tutor && String(req.tutor._id) !== String(tutorId)) {
      return sendError(res, 'Tutor does not match authenticated user', 'TUTOR_MISMATCH', 403);
    }

    const meeting = await createGoogleMeetMeeting({
      tutorId,
      studentId,
      scheduledTime,
      meetingTitle,
      durationMinutes
    });

    return sendSuccess(res, meeting, 201);
  } catch (error) {
    return sendError(res, error.message, error.code || 'GOOGLE_MEET_FAILED', error.status || 500);
  }
};

export const getPermanentLink = async (req, res) => {
  try {
    const {
      tutorId,
      scheduledTime,
      meetingTitle,
      durationMinutes,
      forceNew
    } = req.body;

    const resolvedTutorId = tutorId || req.tutor?._id;
    const missingFields = ['tutorId'].filter((field) => !resolvedTutorId);

    if (missingFields.length > 0) {
      return sendError(res, 'Missing required fields: tutorId', 'MISSING_FIELDS', 400);
    }

    if (req.tutor && String(req.tutor._id) !== String(resolvedTutorId)) {
      return sendError(res, 'Tutor does not match authenticated user', 'TUTOR_MISMATCH', 403);
    }

    const meeting = await getOrCreatePermanentGoogleMeetLink({
      tutorId: resolvedTutorId,
      meetingTitle: meetingTitle || 'Permanent Tutor Room',
      scheduledTime,
      durationMinutes,
      forceNew: Boolean(forceNew)
    });

    return sendSuccess(res, meeting, 201);
  } catch (error) {
    return sendError(res, error.message, error.code || 'GOOGLE_MEET_FAILED', error.status || 500);
  }
};

export const startOAuth = async (req, res) => {
  try {
    const { redirect } = req.query;
    const payload = getGoogleOAuthUrl({ redirect });
    return sendSuccess(res, payload);
  } catch (error) {
    return sendError(res, error.message, error.code || 'GOOGLE_OAUTH_FAILED', error.status || 500);
  }
};

export const oauthStatus = async (req, res) => {
  try {
    const payload = await getGoogleOAuthStatus();
    return sendSuccess(res, payload);
  } catch (error) {
    return sendError(res, error.message, error.code || 'GOOGLE_OAUTH_FAILED', error.status || 500);
  }
};

export const refreshOAuth = async (req, res) => {
  try {
    const payload = await refreshGoogleOAuth();
    return sendSuccess(res, payload);
  } catch (error) {
    return sendError(res, error.message, error.code || 'GOOGLE_OAUTH_FAILED', error.status || 500);
  }
};

export const revokeOAuth = async (req, res) => {
  try {
    const payload = await revokeGoogleOAuth();
    return sendSuccess(res, payload);
  } catch (error) {
    return sendError(res, error.message, error.code || 'GOOGLE_OAUTH_FAILED', error.status || 500);
  }
};
