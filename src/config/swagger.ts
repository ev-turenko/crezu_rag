import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CREZU RAG API',
      version: '1.0.0',
      description: 'API documentation for CREZU RAG - AI-powered financial advisory platform',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        ChatMessage: {
          type: 'object',
          properties: {
            index: {
              type: 'number',
            },
            role: {
              type: 'string',
              enum: ['system', 'user', 'assistant'],
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        InferenceRequest: {
          type: 'object',
          required: ['message', 'params'],
          properties: {
            message: {
              type: 'string',
              description: 'The user message',
            },
            messages: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ChatMessage',
              },
            },
            params: {
              type: 'object',
              required: ['country'],
              properties: {
                country: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'number' },
                  ],
                  description: 'Country code or ID',
                },
                provider: {
                  oneOf: [
                    { type: 'string' },
                    { type: 'number' },
                  ],
                },
                chat_id: {
                  type: 'string',
                },
                client_id: {
                  type: 'string',
                },
                is_guest_chat: {
                  type: 'boolean',
                },
                expflow: {
                  type: 'string',
                  nullable: true,
                },
              },
            },
          },
        },
        Suggestion: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
            },
            title: {
              type: 'string',
            },
            text: {
              type: 'string',
            },
            prompt: {
              type: 'string',
            },
            category: {
              type: 'string',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            error: {
              type: 'string',
            },
          },
        },
      },
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth',
        },
      },
    },
    tags: [
      {
        name: 'AI Inference',
        description: 'Chat and AI inference endpoints',
      },
      {
        name: 'Configuration',
        description: 'Configuration and reference data endpoints',
      },
      {
        name: 'Files',
        description: 'File management endpoints',
      },
      {
        name: 'User Management',
        description: 'User profile and account endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Search',
        description: 'Search endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/swagger-docs/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
