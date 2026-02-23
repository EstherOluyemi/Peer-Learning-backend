import { google } from 'googleapis';
import crypto from 'crypto';
import GoogleMeetMeeting from '../models/GoogleMeetMeeting.js';
import Tutor from '../models/Tutor.js';

const getOAuthClient = ({ requireRefreshToken = true } = {}) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !redirectUri || (requireRefreshToken && !refreshToken)) {
    const error = new Error('Google OAuth credentials are not configured');
    error.code = 'AUTH_CONFIGURATION_MISSING';
    error.status = 500;
    throw error;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }
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

const buildCalendarClient = () => {
  const auth = getOAuthClient();
  return google.calendar({ version: 'v3', auth });
};

const getOAuthScopes = () => {
  const rawScopes = process.env.GOOGLE_OAUTH_SCOPES;
  if (rawScopes) {
    return rawScopes.split(',').map(scope => scope.trim()).filter(Boolean);
  }
  return ['https://www.googleapis.com/auth/calendar.events'];
};

const createCalendarEventWithMeet = async ({ summary, startTime, endTime }) => {
  const calendar = buildCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const requestId = crypto.randomUUID();

  const event = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary,
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

  return {
    joinUrl,
    meetingId,
    calendarEventId: eventData.id
  };
};

const validatePermanentLink = async ({ calendarEventId }) => {
  const calendar = buildCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  try {
    const event = await calendar.events.get({ calendarId, eventId: calendarEventId });
    const eventData = event?.data;
    if (!eventData || eventData.status === 'cancelled') {
      return { valid: false, reason: 'MEETING_LINK_INVALID' };
    }
    const joinUrl = eventData?.hangoutLink || eventData?.conferenceData?.entryPoints?.[0]?.uri;
    if (!joinUrl) {
      return { valid: false, reason: 'MEETING_LINK_INVALID' };
    }
    return { valid: true, joinUrl };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 410) {
      return { valid: false, reason: 'MEETING_LINK_INVALID' };
    }
    const mapped = mapGoogleError(error);
    const mappedError = new Error(mapped.message);
    mappedError.code = mapped.code;
    mappedError.status = mapped.status;
    throw mappedError;
  }
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
    const { joinUrl, meetingId, calendarEventId } = await createCalendarEventWithMeet({
      summary: meetingTitle,
      startTime,
      endTime
    });

    const meetingDoc = await GoogleMeetMeeting.create({
      tutorId,
      studentId,
      meetingId,
      calendarEventId,
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

export const getOrCreatePermanentGoogleMeetLink = async ({
  tutorId,
  meetingTitle,
  scheduledTime,
  durationMinutes = 60,
  forceNew = false
}) => {
  const tutor = await Tutor.findById(tutorId);
  if (!tutor) {
    const error = new Error('Tutor not found');
    error.code = 'TUTOR_NOT_FOUND';
    error.status = 404;
    throw error;
  }

  const now = new Date();
  const hadExisting = Boolean(tutor.permanentMeetLink);
  if (!forceNew && tutor.permanentMeetLink && tutor.permanentMeetCalendarEventId && !tutor.permanentMeetInvalidatedAt) {
    const validation = await validatePermanentLink({ calendarEventId: tutor.permanentMeetCalendarEventId });
    if (validation.valid) {
      await Tutor.updateOne(
        { _id: tutor._id },
        { $inc: { permanentMeetUsageCount: 1 }, $set: { permanentMeetLastUsedAt: now } }
      );
      console.log(JSON.stringify({
        event: 'google_meet_permanent_link_reused',
        tutorId: String(tutor._id),
        calendarEventId: tutor.permanentMeetCalendarEventId,
        meetingId: tutor.permanentMeetMeetingId
      }));
      const updatedTutor = await Tutor.findById(tutor._id);
      return {
        meetingId: updatedTutor.permanentMeetMeetingId,
        joinUrl: updatedTutor.permanentMeetLink,
        startTime: updatedTutor.permanentMeetLinkCreatedAt,
        endTime: null,
        usageCount: updatedTutor.permanentMeetUsageCount,
        lastUsedAt: updatedTutor.permanentMeetLastUsedAt,
        invalidatedAt: updatedTutor.permanentMeetInvalidatedAt,
        calendarEventId: updatedTutor.permanentMeetCalendarEventId
      };
    }

    await Tutor.updateOne(
      { _id: tutor._id },
      { $set: { permanentMeetInvalidatedAt: now } }
    );
    console.log(JSON.stringify({
      event: 'google_meet_permanent_link_invalidated',
      tutorId: String(tutor._id),
      calendarEventId: tutor.permanentMeetCalendarEventId,
      meetingId: tutor.permanentMeetMeetingId
    }));
  }

  const { startTime, endTime } = validateTimeSlot(
    scheduledTime || new Date(Date.now() + 5 * 60000).toISOString(),
    durationMinutes
  );

  try {
    const { joinUrl, meetingId, calendarEventId } = await createCalendarEventWithMeet({
      summary: meetingTitle || 'Permanent Tutor Room',
      startTime,
      endTime
    });

    await Tutor.updateOne(
      { _id: tutor._id },
      {
        $set: {
          permanentMeetLink: joinUrl,
          permanentMeetMeetingId: meetingId,
          permanentMeetCalendarEventId: calendarEventId,
          permanentMeetLinkCreatedAt: now,
          permanentMeetLastUsedAt: now,
          permanentMeetInvalidatedAt: null
        },
        $inc: { permanentMeetUsageCount: 1 }
      }
    );

    console.log(JSON.stringify({
      event: hadExisting || forceNew ? 'google_meet_permanent_link_regenerated' : 'google_meet_permanent_link_assigned',
      tutorId: String(tutor._id),
      calendarEventId,
      meetingId
    }));

    const updatedTutor = await Tutor.findById(tutor._id);
    return {
      meetingId: updatedTutor.permanentMeetMeetingId,
      joinUrl: updatedTutor.permanentMeetLink,
      startTime: updatedTutor.permanentMeetLinkCreatedAt,
      endTime: null,
      usageCount: updatedTutor.permanentMeetUsageCount,
      lastUsedAt: updatedTutor.permanentMeetLastUsedAt,
      invalidatedAt: updatedTutor.permanentMeetInvalidatedAt,
      calendarEventId: updatedTutor.permanentMeetCalendarEventId
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

export const getGoogleOAuthUrl = ({ redirect } = {}) => {
  const oauth2Client = getOAuthClient({ requireRefreshToken: false });
  const scopes = getOAuthScopes();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state: redirect ? encodeURIComponent(redirect) : undefined
  });
  return { url, scopes };
};

export const getGoogleOAuthStatus = async () => {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    return { connected: false, expiresAt: null, scopes: [], status: 'missing_token' };
  }
  try {
    const oauth2Client = getOAuthClient();
    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token;
    if (!accessToken) {
      return { connected: false, expiresAt: null, scopes: [], status: 'token_error' };
    }
    const tokenInfo = await oauth2Client.getTokenInfo(accessToken);
    return {
      connected: true,
      expiresAt: tokenInfo?.expiry_date || null,
      scopes: tokenInfo?.scopes || [],
      status: 'connected'
    };
  } catch (error) {
    const mapped = mapGoogleError(error);
    const mappedError = new Error(mapped.message);
    mappedError.code = mapped.code;
    mappedError.status = mapped.status;
    throw mappedError;
  }
};

export const refreshGoogleOAuth = async () => {
  try {
    const oauth2Client = getOAuthClient();
    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token;
    if (!accessToken) {
      const error = new Error('Failed to refresh access token');
      error.code = 'AUTH_FAILED';
      error.status = 401;
      throw error;
    }
    const tokenInfo = await oauth2Client.getTokenInfo(accessToken);
    return {
      connected: true,
      expiresAt: tokenInfo?.expiry_date || null,
      scopes: tokenInfo?.scopes || [],
      status: 'refreshed'
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

export const revokeGoogleOAuth = async () => {
  try {
    const oauth2Client = getOAuthClient();
    await oauth2Client.revokeCredentials();
    return { revoked: true };
  } catch (error) {
    if (error?.code && error?.status) throw error;
    const mapped = mapGoogleError(error);
    const mappedError = new Error(mapped.message);
    mappedError.code = mapped.code;
    mappedError.status = mapped.status;
    throw mappedError;
  }
};
