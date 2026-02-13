# Peer Learning System - Frontend Integration Guide

This document provides detailed usage instructions for the backend APIs. All endpoints are prefixed with `/api`.

## Table of Contents
1. [General Information](#general-information)
2. [Tutor APIs](#tutor-apis)
3. [Learner APIs](#learner-apis)
4. [Shared Models & Enums](#shared-models--enums)

---

## 1. General Information

### Base URL
`http://localhost:3000/api`

### Headers
All protected routes require a JWT token in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Standard Response Format
**Success:**
```json
{
  "status": "success",
  "data": { ... },
  "metadata": { "total": 100, "page": 1 } // Optional
}
```

**Error:**
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "timestamp": "2024-06-01T10:00:00Z"
}
```

---

## 2. Tutor APIs

### 2.1 Authentication
| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| POST | `/v1/tutor/auth/register` | Register a new tutor | `{ name, email, password, bio, subjects: [], hourlyRate }` |
| POST | `/v1/tutor/auth/login` | Login as tutor | `{ email, password }` |

### 2.2 Profile Management (Protected)
| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| GET | `/v1/tutor/me` | Get own profile | N/A |
| PATCH | `/v1/tutor/me` | Update profile | `{ bio, subjects, hourlyRate, availability }` |

### 2.3 Session Management (Protected)
| Method | Endpoint | Description | Body / Query |
| :--- | :--- | :--- | :--- |
| POST | `/v1/tutor/sessions` | Create a session | `{ courseId, startTime, endTime, meetingLink, maxParticipants }` |
| GET | `/v1/tutor/sessions` | List sessions | Query: `?status=scheduled&startDate=...` |
| PATCH | `/v1/tutor/sessions/:id` | Update session | `{ status, meetingLink, ... }` |
| DELETE | `/v1/tutor/sessions/:id` | Delete session | N/A |

### 2.4 Student & Analytics (Protected)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/v1/tutor/students` | List all unique students |
| GET | `/v1/tutor/analytics/overview` | Dashboard stats |
| GET | `/v1/tutor/analytics/earnings` | Earnings history |
| GET | `/v1/tutor/analytics/reviews` | Review analytics |

---

## 3. Learner APIs

### 3.1 Authentication
| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| POST | `/v1/learner/auth/register` | Register a new learner | `{ name, email, password, interests: [] }` |
| POST | `/v1/learner/auth/login` | Login as learner | `{ email, password }` |

### 3.2 Course Discovery & Enrollment
| Method | Endpoint | Description | Body / Query |
| :--- | :--- | :--- | :--- |
| GET | `/v1/learner/courses` | Browse courses | Query: `?subject=...&level=...` |
| POST | `/v1/learner/courses/:id/enroll` | Enroll in course | N/A (Protected) |

### 3.3 Progress & Learning (Protected)
| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| GET | `/v1/learner/me/progress` | Fetch all progress | N/A |
| PATCH | `/v1/learner/me/progress/:courseId` | Mark module complete | `{ moduleId }` |
| POST | `/v1/learner/assessments/:id/submit` | Submit assessment | `{ submissionUrl }` |

### 3.4 Peer Interaction (Protected)
| Method | Endpoint | Description | Body |
| :--- | :--- | :--- | :--- |
| GET | `/v1/learner/peers` | Find peers in same courses | N/A |
| POST | `/v1/learner/messages` | Send message | `{ receiverId, message }` |

---

## 4. Shared Models & Enums

### Session Status
- `scheduled`
- `ongoing`
- `completed`
- `cancelled`

### Course Level
- `Beginner`
- `Intermediate`
- `Advanced`

### Availability Slot
```json
{
  "day": "Monday",
  "slots": [{ "startTime": "09:00", "endTime": "10:00" }]
}
```
