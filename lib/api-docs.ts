// =============================================================================
// API Documentation (OpenAPI 3.1)
// =============================================================================
// Centralized OpenAPI specification for the AI Website Builder Studio API.
// =============================================================================

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'AI Website Builder Studio API',
    version: '1.0.0',
    description: `
The AI Website Builder Studio API provides programmatic access to website generation,
management, deployment, and collaboration features.

## Authentication
All endpoints require authentication via Clerk session tokens.
Include the session token in the \`Authorization\` header as \`Bearer <token>\`.

## Rate Limiting
API endpoints are rate-limited based on your subscription plan:
- **Anonymous**: 10 requests/minute
- **Free**: 30 requests/minute
- **Pro**: 60 requests/minute
- **Enterprise**: 120 requests/minute

Rate limit headers are included in responses:
- \`X-RateLimit-Limit\`: Maximum requests per window
- \`X-RateLimit-Remaining\`: Remaining requests
- \`X-RateLimit-Reset\`: Window reset timestamp

## Error Handling
All errors return a consistent structure:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
\`\`\`
`,
    contact: {
      name: 'API Support',
      email: 'support@aibuilder.studio',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://aibuilder.studio',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns the health status of the application and its dependencies.',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
                    version: { type: 'string' },
                    uptime: { type: 'number' },
                    timestamp: { type: 'string', format: 'date-time' },
                    checks: {
                      type: 'object',
                      properties: {
                        database: { type: 'string', enum: ['ok', 'error'] },
                        redis: { type: 'string', enum: ['ok', 'error'] },
                      },
                    },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Service is unhealthy',
          },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects',
        description: 'Returns a paginated list of projects owned by the authenticated user.',
        operationId: 'listProjects',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 50 },
          },
        ],
        responses: {
          '200': {
            description: 'List of projects',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create project',
        description: 'Creates a new project.',
        operationId: 'createProject',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 100 },
                  description: { type: 'string', maxLength: 500 },
                  industry: { type: 'string' },
                  businessType: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Project created',
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project',
        description: 'Returns a project by ID.',
        operationId: 'getProject',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Project details',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
      patch: {
        tags: ['Projects'],
        summary: 'Update project',
        description: 'Updates project settings.',
        operationId: 'updateProject',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  settings: { type: 'object' },
                  globalStyles: { type: 'object' },
                  seo: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project updated',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project',
        description: 'Deletes a project and all its data.',
        operationId: 'deleteProject',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Project deleted',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    '/api/projects/{id}/sections': {
      post: {
        tags: ['Sections'],
        summary: 'Create section',
        description: 'Creates a new section within a project page.',
        operationId: 'createSection',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Project ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pageId', 'type'],
                properties: {
                  pageId: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: [
                      'hero', 'features', 'testimonials', 'pricing',
                      'cta', 'about', 'blog', 'faq', 'contact',
                      'gallery', 'team', 'stats', 'logos',
                    ],
                  },
                  layout: { type: 'string' },
                  content: { type: 'object' },
                  afterSectionId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Section created',
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
        },
      },
    },
    '/api/projects/{id}/comments': {
      get: {
        tags: ['Collaboration'],
        summary: 'List comments',
        description: 'Returns comments for a project.',
        operationId: 'listComments',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Project ID',
          },
          {
            name: 'sectionId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by section ID',
          },
        ],
        responses: {
          '200': {
            description: 'List of comments',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
      post: {
        tags: ['Collaboration'],
        summary: 'Create comment',
        description: 'Creates a new comment on a project.',
        operationId: 'createComment',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Project ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  sectionId: { type: 'string' },
                  content: { type: 'string', minLength: 1, maxLength: 5000 },
                  parentId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Comment created',
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
        },
      },
    },
    '/api/projects/{id}/blog': {
      get: {
        tags: ['Blog'],
        summary: 'List blog posts',
        description: 'Returns blog posts for a project.',
        operationId: 'listBlogPosts',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Project ID',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['draft', 'published'] },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20, maximum: 50 },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of blog posts',
          },
        },
      },
      post: {
        tags: ['Blog'],
        summary: 'Generate blog post',
        description: 'Generates a new blog post using AI.',
        operationId: 'generateBlogPost',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Project ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['topic'],
                properties: {
                  topic: { type: 'string', minLength: 1, maxLength: 200 },
                  tone: { type: 'string', default: 'professional' },
                  wordCount: { type: 'integer', minimum: 300, maximum: 5000, default: 800 },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  includeImages: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Blog post generated',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/ai/generate': {
      post: {
        tags: ['AI'],
        summary: 'Generate website',
        description: 'Generates a complete website from a business description.',
        operationId: 'generateWebsite',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['description'],
                properties: {
                  description: { type: 'string', minLength: 10 },
                  businessName: { type: 'string' },
                  industry: { type: 'string' },
                  businessType: { type: 'string' },
                  style: { type: 'string' },
                  pages: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Generation started (streaming)',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
    },
    '/api/ai/refine': {
      post: {
        tags: ['AI'],
        summary: 'Refine section',
        description: 'Refines a section using AI based on user feedback.',
        operationId: 'refineSection',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sectionId', 'instruction'],
                properties: {
                  sectionId: { type: 'string' },
                  instruction: { type: 'string' },
                  preserveStyle: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Section refined',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
    },
    '/api/billing/subscription': {
      get: {
        tags: ['Billing'],
        summary: 'Get subscription',
        description: 'Returns the current subscription details.',
        operationId: 'getSubscription',
        responses: {
          '200': {
            description: 'Subscription details',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    '/api/organizations/{orgId}/members': {
      get: {
        tags: ['Collaboration'],
        summary: 'List members',
        description: 'Returns members of an organization.',
        operationId: 'listMembers',
        parameters: [
          {
            name: 'orgId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'List of members',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
      patch: {
        tags: ['Collaboration'],
        summary: 'Update member role',
        description: 'Updates a member\'s role in the organization.',
        operationId: 'updateMemberRole',
        parameters: [
          {
            name: 'orgId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'role'],
                properties: {
                  userId: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'member', 'viewer'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Role updated',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
    },
    '/api/organizations/{orgId}/invitations': {
      get: {
        tags: ['Collaboration'],
        summary: 'List invitations',
        description: 'Returns pending invitations for an organization.',
        operationId: 'listInvitations',
        parameters: [
          {
            name: 'orgId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'List of invitations',
          },
        },
      },
      post: {
        tags: ['Collaboration'],
        summary: 'Create invitation',
        description: 'Invites a user to the organization.',
        operationId: 'createInvitation',
        parameters: [
          {
            name: 'orgId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['admin', 'member', 'viewer'], default: 'member' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Invitation created',
          },
          '409': {
            $ref: '#/components/responses/Conflict',
          },
        },
      },
    },
    '/api/deploy': {
      post: {
        tags: ['Deployment'],
        summary: 'Deploy project',
        description: 'Deploys a project to the specified platform.',
        operationId: 'deployProject',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId', 'platform'],
                properties: {
                  projectId: { type: 'string' },
                  platform: { type: 'string', enum: ['vercel', 'netlify'] },
                  customDomain: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Deployment started',
          },
          '429': {
            $ref: '#/components/responses/RateLimited',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Clerk Session Token',
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request — validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized — authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden — insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Conflict: {
        description: 'Conflict — resource already exists',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      RateLimited: {
        description: 'Rate limit exceeded',
        headers: {
          'Retry-After': {
            schema: { type: 'integer' },
            description: 'Seconds until rate limit resets',
          },
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          industry: { type: 'string' },
          businessType: { type: 'string' },
          ownerId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Section: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          pageId: { type: 'string' },
          type: { type: 'string' },
          layout: { type: 'string' },
          order: { type: 'integer' },
          content: { type: 'object' },
          styles: { type: 'object' },
          animations: { type: 'array' },
          images: { type: 'array' },
        },
      },
      BlogPost: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          slug: { type: 'string' },
          excerpt: { type: 'string' },
          content: { type: 'string' },
          coverImage: { type: 'string', nullable: true },
          author: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          metaTitle: { type: 'string' },
          metaDescription: { type: 'string' },
          publishedAt: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['draft', 'published'] },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          sectionId: { type: 'string', nullable: true },
          authorId: { type: 'string' },
          content: { type: 'string' },
          parentId: { type: 'string', nullable: true },
          resolvedAt: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
  ],
  tags: [
    { name: 'System', description: 'Health and status endpoints' },
    { name: 'Projects', description: 'Project CRUD operations' },
    { name: 'Sections', description: 'Section management within pages' },
    { name: 'AI', description: 'AI-powered generation and refinement' },
    { name: 'Blog', description: 'AI blog post generation and management' },
    { name: 'Collaboration', description: 'Comments, invitations, and team management' },
    { name: 'Billing', description: 'Subscription and billing management' },
    { name: 'Deployment', description: 'Website deployment to hosting platforms' },
  ],
};
