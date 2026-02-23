# Learner Sessions API Contract

This document lists the learner-facing session APIs needed for the frontend to browse sessions and submit join requests that require tutor approval.

## Auth
- All endpoints require authentication via cookie session or `Authorization: Bearer <token>`.
- If a learner calls a tutor-only endpoint, return `403` with `code: "TUTOR_ONLY"`.
- If a tutor calls a learner-only endpoint, return `403` with `code: "LEARNER_ONLY"`.

## Session Object (minimum fields used by the frontend)
```json
{
  "_id": "sessionId",
  "title": "Algebra Basics",
  "description": "Linear equations and functions",
  "subject": "Math",
  "level": "Beginner",
  "startTime": "2026-03-01T14:00:00.000Z",
  "endTime": "2026-03-01T15:00:00.000Z",
  "duration": 60,
  "maxParticipants": 10,
  "studentIds": ["learnerId1", "learnerId2"],
  "createdAt": "2026-02-24T10:00:00.000Z",
  "tutor": {
    "id": "tutorId",
    "name": "Jane Doe",
    "avatar": "https://...",
    "rating": 4.8,
    "reviewCount": 21,
    "hourlyRate": 35
  },
  "meetingLink": "https://meet.google.com/abc-defg-hij"
}
```

## 1) Browse Available Sessions
**GET** `/v1/learner/sessions/browse`

Query params (all optional):
- `search` (string): searches title/subject/description/tutor name
- `subject` (string)
- `level` (string)
- `maxPrice` (number)
- `sortBy` (`upcoming` | `popular` | `newest` | `price-low` | `price-high`)
- `page` (number), `limit` (number)

Response:
```json
{
  "data": [
    { "session object": "see above" }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 73 }
}
```

Notes:
- The frontend currently attempts these fallbacks if the above route is missing:
  - `/v1/learner/sessions/available`
  - `/v1/sessions`
  - `/sessions`
- If you only want one canonical endpoint, implement `/v1/learner/sessions/browse` and return `404` for the rest.

## 2) Get Learner’s Enrolled Sessions
**GET** `/v1/learner/sessions`

Response:
```json
{
  "data": [
    {
      "session": { "session object": "see above" },
      "enrollmentStatus": "approved"
    }
  ]
}
```

Notes:
- `enrollmentStatus` should be one of `pending` | `approved` | `rejected`.
- The frontend uses `studentIds` for availability and enroll state; include it on the session object.

## 3) Get Session Details (Learner)
**GET** `/v1/learner/sessions/:sessionId`

Response:
```json
{
  "data": { "session object": "see above" }
}
```

## 4) Submit Join Request (Learner)
**POST** `/v1/learner/sessions/:sessionId/join`

Request body:
```json
{}
```

Response:
```json
{
  "data": {
    "requestId": "requestId",
    "sessionId": "sessionId",
    "learnerId": "learnerId",
    "status": "pending"
  }
}
```

Notes:
- This should create a pending request that requires tutor approval.
- If the learner is already approved, respond with `status: "approved"` and idempotent success.
- If the session is full, return `409` with `code: "SESSION_FULL"`.

## 5) Leave Session (Learner)
**POST** `/v1/learner/sessions/:sessionId/leave`

Request body:
```json
{}
```

Response:
```json
{
  "data": { "sessionId": "sessionId", "status": "left" }
}
```

## 6) Tutor Review of Join Requests (Required for Approval Flow)
**GET** `/v1/tutor/sessions/:sessionId/requests`

Response:
```json
{
  "data": [
    {
      "requestId": "requestId",
      "sessionId": "sessionId",
      "learnerId": "learnerId",
      "status": "pending",
      "createdAt": "2026-02-24T10:00:00.000Z"
    }
  ]
}
```

**POST** `/v1/tutor/sessions/:sessionId/requests/:requestId/approve`

Response:
```json
{
  "data": { "requestId": "requestId", "status": "approved" }
}
```

**POST** `/v1/tutor/sessions/:sessionId/requests/:requestId/reject`

Response:
```json
{
  "data": { "requestId": "requestId", "status": "rejected" }
}
```

## Error Shape (recommended)
```json
{
  "message": "Human readable message",
  "code": "TUTOR_ONLY"
}
```
