# Frontend Google Meet Integration Guide

This document provides AI-ready, step-by-step guidance for integrating with the Google Meet creation endpoint exposed by the backend.

## API Endpoint Specification

| Item | Value |
| --- | --- |
| Method | POST |
| Full URL (Local) | http://localhost:5000/api/v1/tutor/google-meet/create-meeting |
| Full URL (Production) | https://peer-learning-backend-h7x5.onrender.com/api/v1/tutor/google-meet/create-meeting |
| Content-Type | application/json |

## Authentication Requirements

The endpoint is protected and requires authentication using **either**:
- **Bearer token** in `Authorization` header, or
- **Cookie** named `token`

### Bearer Token Header
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Cookie Authentication
```http
Cookie: token=<JWT_TOKEN>
Content-Type: application/json
```

## Request Payload Structure

### Required Fields
- `tutorId` (string): The tutor’s MongoDB ObjectId.
- `studentId` (string): The student’s MongoDB ObjectId.
- `scheduledTime` (string, ISO 8601): Meeting start time in UTC.
- `meetingTitle` (string): Title shown on the calendar event.

### Optional Fields
- `durationMinutes` (number): Duration in minutes. Default: 60.

### JSON Schema (AI Parsable)
```json
{
  "type": "object",
  "required": ["tutorId", "studentId", "scheduledTime", "meetingTitle"],
  "properties": {
    "tutorId": { "type": "string" },
    "studentId": { "type": "string" },
    "scheduledTime": { "type": "string", "format": "date-time" },
    "meetingTitle": { "type": "string" },
    "durationMinutes": { "type": "number", "default": 60 }
  }
}
```

### Example Request Body
```json
{
  "tutorId": "64f123abc123abc123abc123",
  "studentId": "64f123abc123abc123abc124",
  "scheduledTime": "2026-02-28T10:00:00.000Z",
  "meetingTitle": "Algebra Session",
  "durationMinutes": 60
}
```

## Response Format

### Success Response (201)
```json
{
  "status": "success",
  "data": {
    "meetingId": "google-meet-id",
    "joinUrl": "https://meet.google.com/abc-defg-hij",
    "startTime": "2026-02-28T10:00:00.000Z",
    "endTime": "2026-02-28T11:00:00.000Z"
  }
}
```

### Error Response (Standard)
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "timestamp": "2026-02-22T21:50:00.000Z"
}
```

## Error Codes and Scenarios

| Code | HTTP | Scenario | Message Example |
| --- | --- | --- | --- |
| MISSING_FIELDS | 400 | Required fields missing | Missing required fields: tutorId, studentId |
| INVALID_TIME_SLOT | 400 | Invalid date/time or past time | Scheduled time must be in the future |
| TUTOR_MISMATCH | 403 | Auth tutor does not match tutorId | Tutor does not match authenticated user |
| AUTH_FAILED | 401 | OAuth token invalid/expired | Invalid Credentials |
| PERMISSION_DENIED | 403 | Calendar permissions missing | The user does not have permission |
| QUOTA_EXCEEDED | 429 | Google API quota exceeded | Quota exceeded for quota group |
| MEETING_LINK_FAILED | 500 | Google did not return meet link | Failed to generate meeting link |
| GOOGLE_API_ERROR | 500 | Any other Google API error | Internal API error |
| GOOGLE_MEET_FAILED | 500 | Unhandled service errors | Google Meet integration failed |

## Implementation Examples

### Fetch (Browser)
```javascript
const response = await fetch('http://localhost:5000/api/v1/tutor/google-meet/create-meeting', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    tutorId,
    studentId,
    scheduledTime,
    meetingTitle,
    durationMinutes: 60
  })
});

const payload = await response.json();
if (!response.ok) {
  throw new Error(payload.message);
}
```

### Axios
```javascript
const payload = {
  tutorId,
  studentId,
  scheduledTime,
  meetingTitle,
  durationMinutes: 60
};

const { data } = await axios.post(
  'http://localhost:5000/api/v1/tutor/google-meet/create-meeting',
  payload,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

## Error Handling Strategies

1. Always parse and check `status` and `code` from the response.
2. Show friendly messages for `MISSING_FIELDS` and `INVALID_TIME_SLOT`.
3. Trigger re-auth for `AUTH_FAILED`.
4. Backoff and retry later for `QUOTA_EXCEEDED`.
5. Log full error payload for `GOOGLE_API_ERROR`.

## Rate Limiting

Rate limits are enforced by Google Calendar API quotas. If you receive `QUOTA_EXCEEDED`:
- apply exponential backoff,
- reduce burst requests,
- or request higher quota in Google Cloud Console.

## Security Considerations

- Never store Google OAuth credentials in the frontend.
- Always send JWT over HTTPS.
- Do not trust user-provided tutorId; backend verifies with authenticated tutor.
- Avoid logging access tokens or refresh tokens in frontend logs.

## Testing Procedures

### cURL Example
```bash
curl -X POST "http://localhost:5000/api/v1/tutor/google-meet/create-meeting" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "tutorId": "64f123abc123abc123abc123",
    "studentId": "64f123abc123abc123abc124",
    "scheduledTime": "2026-02-28T10:00:00.000Z",
    "meetingTitle": "Algebra Session",
    "durationMinutes": 60
  }'
```

### Expected 201 Response
```json
{
  "status": "success",
  "data": {
    "meetingId": "google-meet-id",
    "joinUrl": "https://meet.google.com/abc-defg-hij",
    "startTime": "2026-02-28T10:00:00.000Z",
    "endTime": "2026-02-28T11:00:00.000Z"
  }
}
```

## Troubleshooting Guide

| Issue | Cause | Resolution |
| --- | --- | --- |
| 404 Not Found | Route not registered | Confirm backend has `/v1/tutor/google-meet/create-meeting` |
| 401 AUTH_FAILED | Invalid/expired OAuth | Refresh credentials on backend |
| 403 PERMISSION_DENIED | Missing calendar scope | Ensure OAuth consent includes Calendar |
| 429 QUOTA_EXCEEDED | Quota limits reached | Backoff or increase quota |
| 400 INVALID_TIME_SLOT | Past or invalid time | Send valid ISO 8601 future time |
| 500 MEETING_LINK_FAILED | Missing Meet link from Google | Verify conferenceData settings |

## Best Practices

- Always send scheduledTime in UTC ISO 8601 format.
- Store and reuse meeting metadata from the response.
- Implement retries for transient Google errors.
- Handle timezone conversion on the frontend explicitly.
- Keep auth tokens secure and short-lived.
