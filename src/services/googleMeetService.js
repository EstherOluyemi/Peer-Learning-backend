import { google } from 'googleapis';
import crypto from 'crypto';
import GoogleMeetMeeting from '../models/GoogleMeetMeeting.js';

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
    const error = new Error('Google OAuth credentials are not configured');
    error.code = 'AUTH_CONFIGURATION_MISSING';
    error.status = 500;
    throw error;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
};

const mapGoogleError = (error) => {
  const status = error?.response?.status;
  const reason = error?.response?.data?.error?.errors?.[0]?.reason;
  const message = error?.response?.data?.error?.message || error.message;

  if (status === 401) return { status: 401, code: 'AUTH_FAILED', message };
  if (status === 403 && reason === 'quotaExceeded') return { status: 429, code: 'QUOTA_EXCEEDED', message };
  if (status === 403) return { status: 403, code: 'PERMISSION_DENIED', message };
  return { status: status || 500, code: 'GOOGLE_API_ERROR', message };
};

const validateTimeSlot = (scheduledTime, durationMinutes) => {
  const startTime = new Date(scheduledTime);
  if (Number.isNaN(startTime.getTime())) {
    const error = new Error('Invalid scheduledTime');
    error.code = 'INVALID_TIME_SLOT';
    error.status = 400;
    throw error;
  }
  if (!durationMinutes || Number(durationMinutes) <= 0) {
    const error = new Error('Invalid durationMinutes');
    error.code = 'INVALID_TIME_SLOT';
    error.status = 400;
    throw error;
  }
  const endTime = new Date(startTime.getTime() + Number(durationMinutes) * 60000);
  if (endTime <= startTime) {
    const error = new Error('Invalid time range');
    error.code = 'INVALID_TIME_SLOT';
    error.status = 400;
    throw error;
  }
  if (startTime <= new Date()) {
    const error = new Error('Scheduled time must be in the future');
    error.code = 'INVALID_TIME_SLOT';
    error.status = 400;
    throw error;
  }
  return { startTime, endTime };
};

export const createGoogleMeetMeeting = async ({
  tutorId,
  studentId,
  scheduledTime,
  meetingTitle,
  durationMinutes = 60
}) => {
  const { startTime, endTime } = validateTimeSlot(scheduledTime, durationMinutes);

  try {
    const auth = getOAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const requestId = crypto.randomUUID();

    const event = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: meetingTitle,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      }
    });

    const eventData = event?.data;
    const joinUrl = eventData?.hangoutLink || eventData?.conferenceData?.entryPoints?.[0]?.uri;
    const meetingId = eventData?.conferenceData?.conferenceId || eventData?.id;

    if (!joinUrl || !meetingId || !eventData?.id) {
      const error = new Error('Failed to generate meeting link');
      error.code = 'MEETING_LINK_FAILED';
      error.status = 500;
      throw error;
    }

    const meetingDoc = await GoogleMeetMeeting.create({
      tutorId,
      studentId,
      meetingId,
      calendarEventId: eventData.id,
      joinUrl,
      title: meetingTitle,
      startTime,
      endTime
    });

    return {
      meetingId: meetingDoc.meetingId,
      joinUrl: meetingDoc.joinUrl,
      startTime: meetingDoc.startTime,
      endTime: meetingDoc.endTime
    };
  } catch (error) {
    if (error?.code && error?.status) throw error;
    const mapped = mapGoogleError(error);
    const mappedError = new Error(mapped.message);
    mappedError.code = mapped.code;
    mappedError.status = mapped.status;
    throw mappedError;
  }
};
