import { z } from 'zod';
import { insertQadaProgressSchema, qadaProgress } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  qada: {
    get: {
      method: 'GET' as const,
      path: '/api/qada' as const,
      responses: {
        200: z.custom<typeof qadaProgress.$inferSelect>(),
        404: z.null(), // Allow null if not set up yet
        401: errorSchemas.unauthorized,
      },
    },
    setup: {
      method: 'POST' as const,
      path: '/api/qada' as const,
      input: z.object({
        missedStartDate: z.string(), // ISO date string
        missedEndDate: z.string(), // ISO date string
      }),
      responses: {
        201: z.custom<typeof qadaProgress.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    updateCounts: {
      method: 'PATCH' as const,
      path: '/api/qada/counts' as const,
      input: z.object({
        prayer: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr']),
        action: z.enum(['increment', 'decrement']),
      }),
      responses: {
        200: z.custom<typeof qadaProgress.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type QadaSetupInput = z.infer<typeof api.qada.setup.input>;
export type QadaUpdateInput = z.infer<typeof api.qada.updateCounts.input>;
export type QadaResponse = z.infer<typeof api.qada.get.responses[200]>;
