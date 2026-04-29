import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Vext API',
    version: '1.0.0',
    description: 'Extract structured intelligence from any YouTube video. [Docs](https://vext.so/docs)',
    contact: { name: 'Vext', url: 'https://vext.so' },
    license: { name: 'MIT' },
  },
  servers: [{ url: 'https://vext.so/v1', description: 'Production' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http', scheme: 'bearer',
        description: 'API key from https://vext.so/dashboard/api-keys',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error:   { type: 'string', example: 'unauthorized' },
          message: { type: 'string' },
          hint:    { type: 'string' },
        },
      },
      Card: {
        type: 'object',
        properties: {
          cardId:         { type: 'string', example: 'aB3dF9xQ' },
          title:          { type: 'string' },
          classification: { type: 'string', enum: ['setup/tutorial','strategy/framework','tool demo','finance/setup','product teardown','interview/talk','research/paper','debate/discussion'] },
          output:         { type: 'object', description: 'Classification-specific structured data' },
          views:          { type: 'integer' },
          shareUrl:       { type: 'string', format: 'uri' },
          exportUrl:      { type: 'string', format: 'uri' },
          createdAt:      { type: 'string', format: 'date-time' },
        },
      },
      Usage: {
        type: 'object',
        properties: {
          plan:             { type: 'string', example: 'free' },
          totalExtractions: { type: 'integer', example: 12 },
          limit:            { type: 'integer', example: 50, nullable: true },
          remaining:        { type: 'integer', example: 38, nullable: true },
          bonusCredits:     { type: 'integer', example: 5 },
        },
      },
    },
  },
  paths: {
    '/extract': {
      post: {
        operationId: 'extractVideo',
        summary: 'Extract a video',
        description: 'Submits a YouTube URL for AI extraction. Returns a cardId within ~30 seconds.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['videoUrl'],
                properties: {
                  videoUrl: { type: 'string', format: 'uri', example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                  title:    { type: 'string', maxLength: 300, description: 'Override auto-detected title' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Extraction complete',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cardId:         { type: 'string', example: 'aB3dF9xQ' },
                    shareUrl:       { type: 'string' },
                    classification: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          422: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Error' },
                    { type: 'object', properties: { plan: { type: 'string' }, limit: { type: 'integer' }, used: { type: 'integer' } } },
                  ],
                },
              },
            },
          },
          503: { description: 'Provider unavailable — retry in 60s' },
        },
      },
    },
    '/cards/{cardId}': {
      get: {
        operationId: 'getCard',
        summary: 'Get a card',
        parameters: [{ name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Card data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Card' } } },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Card not found' },
        },
      },
    },
    '/usage': {
      get: {
        operationId: 'getUsage',
        summary: 'Get API key usage',
        responses: {
          200: {
            description: 'Usage statistics',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Usage' } } },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
  },
};

export function GET(_req: NextRequest) {
  return Response.json(SPEC, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
