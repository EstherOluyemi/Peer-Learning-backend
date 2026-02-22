import { createGoogleMeetMeeting } from '../services/googleMeetService.js';
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
