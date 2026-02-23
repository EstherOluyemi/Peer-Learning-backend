export default {
  openapi: '3.0.3',
  info: {
    title: 'Peer Learning Backend API',
    version: '1.0.0',
    description: 'OpenAPI documentation for Peer Learning System',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server',
    },
    {
      url: 'https://peer-learning-backend-h7x5.onrender.com/api',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'General' },
    { name: 'Tutor Auth' },
    { name: 'Tutor Profile' },
    { name: 'Tutor Sessions' },
    { name: 'Tutor Students' },
    { name: 'Tutor Analytics' },
    { name: 'Tutor Reviews' },
    { name: 'Tutor Google Meet' },
    { name: 'Learner Auth' },
    { name: 'Learner Courses' },
    { name: 'Learner Progress' },
    { name: 'Learner Assessments' },
    { name: 'Learner Interaction' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token'
      }
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { type: 'object' },
          metadata: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          code: { type: 'string', example: 'ERROR_CODE' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Tutor: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          bio: { type: 'string' },
          subjects: { type: 'array', items: { type: 'string' } },
          hourlyRate: { type: 'number' }
        }
      },
      Learner: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          interests: { type: 'array', items: { type: 'string' } }
        }
      },
      TutorRegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
          bio: { type: 'string' },
          subjects: { type: 'array', items: { type: 'string' } },
          hourlyRate: { type: 'number' }
        },
        example: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'securepassword123',
          bio: 'Experienced math tutor.',
          subjects: ['Math', 'Physics'],
          hourlyRate: 30
        }
      },
      TutorLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        },
        example: {
          email: 'john@example.com',
          password: 'securepassword123'
        }
      },
      LearnerRegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
          interests: { type: 'array', items: { type: 'string' } }
        },
        example: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'securepassword123',
          interests: ['Data Science', 'Web Dev']
        }
      },
      UpdateTutorProfileRequest: {
        type: 'object',
        properties: {
          bio: { type: 'string' },
          subjects: { type: 'array', items: { type: 'string' } },
          hourlyRate: { type: 'number' },
          availability: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'string' },
                slots: {
                  type: 'array',
                  items: { type: 'object', properties: { startTime: { type: 'string' }, endTime: { type: 'string' } } }
                }
              }
            }
          }
        }
      },
      CreateSessionRequest: {
        type: 'object',
        required: ['courseId', 'startTime', 'endTime', 'meetingLink', 'maxParticipants'],
        properties: {
          courseId: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          meetingLink: { type: 'string' },
          maxParticipants: { type: 'integer' }
        }
      },
      SubmitAssessmentRequest: {
        type: 'object',
        required: ['submissionUrl'],
        properties: {
          submissionUrl: { type: 'string' }
        }
      },
      UpdateProgressRequest: {
        type: 'object',
        required: ['moduleId'],
        properties: {
          moduleId: { type: 'string' }
        }
      },
      GoogleMeetCreateRequest: {
        type: 'object',
        required: ['tutorId', 'studentId', 'scheduledTime', 'meetingTitle'],
        properties: {
          tutorId: { type: 'string' },
          studentId: { type: 'string' },
          scheduledTime: { type: 'string', format: 'date-time' },
          meetingTitle: { type: 'string' },
          durationMinutes: { type: 'number', example: 60 }
        },
        example: {
          tutorId: '64f123abc123abc123abc123',
          studentId: '64f123abc123abc123abc124',
          scheduledTime: '2026-02-28T10:00:00.000Z',
          meetingTitle: 'Algebra Session',
          durationMinutes: 60
        }
      },
      GoogleMeetPermanentLinkRequest: {
        type: 'object',
        required: ['tutorId'],
        properties: {
          tutorId: { type: 'string' },
          scheduledTime: { type: 'string', format: 'date-time' },
          meetingTitle: { type: 'string' },
          durationMinutes: { type: 'number', example: 60 },
          forceNew: { type: 'boolean', example: false }
        },
        example: {
          tutorId: '64f123abc123abc123abc123',
          scheduledTime: '2026-02-28T10:00:00.000Z',
          meetingTitle: 'Permanent Tutor Room',
          durationMinutes: 60,
          forceNew: false
        }
      },
      GoogleOAuthStartResponse: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          scopes: { type: 'array', items: { type: 'string' } }
        }
      },
      GoogleOAuthStatusResponse: {
        type: 'object',
        properties: {
          connected: { type: 'boolean' },
          expiresAt: { type: 'number' },
          scopes: { type: 'array', items: { type: 'string' } },
          status: { type: 'string' }
        }
      },
      GoogleOAuthRevokeResponse: {
        type: 'object',
        properties: {
          revoked: { type: 'boolean' }
        }
      },
      GoogleMeetMeetingResponse: {
        type: 'object',
        properties: {
          meetingId: { type: 'string' },
          joinUrl: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          usageCount: { type: 'number' },
          lastUsedAt: { type: 'string', format: 'date-time' },
          invalidatedAt: { type: 'string', format: 'date-time' },
          calendarEventId: { type: 'string' }
        }
      }
    }
  },
  security: [
    { bearerAuth: [], cookieAuth: [] }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['General'],
        summary: 'Health check',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/auth/register': {
      post: {
        tags: ['Tutor Auth'],
        summary: 'Register a new tutor',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TutorRegisterRequest' } } } },
        responses: {
          201: { description: 'Tutor registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/tutor/auth/login': {
      post: {
        tags: ['Tutor Auth'],
        summary: 'Login as tutor',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TutorLoginRequest' } } } },
        responses: {
          200: { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/tutor/auth/logout': {
      post: {
        tags: ['Tutor Auth'],
        summary: 'Logout tutor',
        responses: {
          200: { description: 'Logged out', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/auth/me': {
      get: {
        tags: ['Tutor Auth'],
        summary: 'Get current tutor profile',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'Profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/tutor/me': {
      get: {
        tags: ['Tutor Profile'],
        summary: 'Get own profile',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'Profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      },
      patch: {
        tags: ['Tutor Profile'],
        summary: 'Update own profile',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTutorProfileRequest' } } } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/sessions': {
      post: {
        tags: ['Tutor Sessions'],
        summary: 'Create a session',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSessionRequest' } } } },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      },
      get: {
        tags: ['Tutor Sessions'],
        summary: 'List sessions',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
        ],
        responses: {
          200: { description: 'Sessions', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/google-meet/create-meeting': {
      post: {
        tags: ['Tutor Google Meet'],
        summary: 'Create Google Meet meeting',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GoogleMeetCreateRequest' } } } },
        responses: {
          201: {
            description: 'Meeting created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { type: 'object', properties: { data: { $ref: '#/components/schemas/GoogleMeetMeetingResponse' } } }
                  ]
                }
              }
            }
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Authentication failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          403: { description: 'Permission denied', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          429: { description: 'Quota exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/tutor/google-meet/permanent-link': {
      post: {
        tags: ['Tutor Google Meet'],
        summary: 'Get or create permanent Google Meet link',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GoogleMeetPermanentLinkRequest' } } } },
        responses: {
          201: {
            description: 'Permanent link',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { type: 'object', properties: { data: { $ref: '#/components/schemas/GoogleMeetMeetingResponse' } } }
                  ]
                }
              }
            }
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Authentication failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          403: { description: 'Permission denied', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          429: { description: 'Quota exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/tutor/google-meet/oauth/start': {
      get: {
        tags: ['Tutor Google Meet'],
        summary: 'Get Google OAuth consent URL',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'redirect', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'OAuth URL',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { type: 'object', properties: { data: { $ref: '#/components/schemas/GoogleOAuthStartResponse' } } }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/v1/tutor/google-meet/oauth/callback': {
      get: {
        tags: ['Tutor Google Meet'],
        summary: 'Google OAuth callback',
        parameters: [
          { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'state', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          302: { description: 'Redirect to client' },
          400: { description: 'OAuth error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/tutor/google-meet/oauth/status': {
      get: {
        tags: ['Tutor Google Meet'],
        summary: 'Check Google OAuth status',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: {
            description: 'OAuth status',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { type: 'object', properties: { data: { $ref: '#/components/schemas/GoogleOAuthStatusResponse' } } }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/v1/tutor/google-meet/oauth/refresh': {
      post: {
        tags: ['Tutor Google Meet'],
        summary: 'Refresh Google OAuth tokens',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: {
            description: 'Refreshed',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { type: 'object', properties: { data: { $ref: '#/components/schemas/GoogleOAuthStatusResponse' } } }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/v1/tutor/google-meet/oauth/revoke': {
      post: {
        tags: ['Tutor Google Meet'],
        summary: 'Revoke Google OAuth credentials',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: {
            description: 'Revoked',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    { type: 'object', properties: { data: { $ref: '#/components/schemas/GoogleOAuthRevokeResponse' } } }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/v1/tutor/sessions/{id}': {
      patch: {
        tags: ['Tutor Sessions'],
        summary: 'Update session',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      },
      delete: {
        tags: ['Tutor Sessions'],
        summary: 'Delete session',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          204: { description: 'Deleted' },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/tutor/students': {
      get: {
        tags: ['Tutor Students'],
        summary: 'List students',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'Students', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/students/{studentId}/progress': {
      get: {
        tags: ['Tutor Students'],
        summary: 'Get student progress',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Progress', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/analytics/overview': {
      get: {
        tags: ['Tutor Analytics'],
        summary: 'Overview analytics',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/analytics/earnings': {
      get: {
        tags: ['Tutor Analytics'],
        summary: 'Earnings analytics',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/analytics/reviews': {
      get: {
        tags: ['Tutor Analytics'],
        summary: 'Review analytics',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/reviews': {
      get: {
        tags: ['Tutor Reviews'],
        summary: 'Get reviews',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'Reviews', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/tutor/reviews/{id}/respond': {
      post: {
        tags: ['Tutor Reviews'],
        summary: 'Respond to a review',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          200: { description: 'Responded', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/learner/auth/register': {
      post: {
        tags: ['Learner Auth'],
        summary: 'Register a new learner',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LearnerRegisterRequest' } } } },
        responses: {
          201: { description: 'Learner registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/learner/auth/login': {
      post: {
        tags: ['Learner Auth'],
        summary: 'Login as learner',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LearnerLoginRequest' } } } },
        responses: {
          200: { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/learner/auth/logout': {
      post: {
        tags: ['Learner Auth'],
        summary: 'Logout learner',
        responses: {
          200: { description: 'Logged out', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/learner/auth/me': {
      get: {
        tags: ['Learner Auth'],
        summary: 'Get current learner profile',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'Profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/learner/courses': {
      get: {
        tags: ['Learner Courses'],
        summary: 'Browse courses',
        parameters: [
          { name: 'subject', in: 'query', schema: { type: 'string' } },
          { name: 'level', in: 'query', schema: { type: 'string' } },
          { name: 'tutor', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Courses', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/learner/courses/{id}/enroll': {
      post: {
        tags: ['Learner Courses'],
        summary: 'Enroll in course',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          201: { description: 'Enrolled', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          400: { description: 'Already enrolled', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/learner/me/progress': {
      get: {
        tags: ['Learner Progress'],
        summary: 'Fetch all progress',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'Progress list', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/learner/me/progress/{courseId}': {
      patch: {
        tags: ['Learner Progress'],
        summary: 'Mark module complete',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'courseId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProgressRequest' } } } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },
    '/v1/learner/assessments/{id}': {
      get: {
        tags: ['Learner Assessments'],
        summary: 'Get assessment details',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Details', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/learner/assessments/{id}/submit': {
      post: {
        tags: ['Learner Assessments'],
        summary: 'Submit assessment',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitAssessmentRequest' } } } },
        responses: {
          200: { description: 'Submitted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/learner/peers': {
      get: {
        tags: ['Learner Interaction'],
        summary: 'List peers',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        responses: {
          200: { description: 'Peers', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    },
    '/v1/learner/messages': {
      post: {
        tags: ['Learner Interaction'],
        summary: 'Send message',
        security: [{ bearerAuth: [], cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          200: { description: 'Message sent', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
        }
      }
    }
  }
};
