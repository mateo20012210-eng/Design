import { z } from 'zod';
import { CATEGORIES, DEAL_TYPES, REGIONS } from './types';

export const cardSchema = z
  .object({
    id: z.string().regex(/^[a-z]{2,4}-\d{3}$/, 'id must look like "acc-001"'),
    category: z.enum(CATEGORIES),
    difficulty: z.enum(['Basic', 'Advanced']),
    question: z.string().min(12).max(400),
    keyAnswer: z.string().min(20).max(900),
    explanation: z.string().min(150),
    commonMistakes: z.array(z.string().min(5)).max(8).optional(),
    followUps: z.array(z.string().min(5)).max(8).optional(),
    ifrsNote: z.string().min(20).optional(),
    tags: z.array(z.string().min(2).max(40)).min(1).max(8),
  })
  .strict();

export const cardArraySchema = z.array(cardSchema);

export const newsItemSchema = z.object({
  id: z.string(),
  title: z.string().min(5),
  url: z.string().url(),
  source: z.string(),
  publishedAt: z.string(),
  dealType: z.enum(DEAL_TYPES),
  region: z.enum(REGIONS),
  dealSize: z.string().optional(),
  excerpt: z.string().max(240).optional(),
  score: z.number(),
  alsoCoveredBy: z.array(z.object({ source: z.string(), url: z.string() })),
});

export const editionSchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/),
  from: z.string(),
  to: z.string(),
  top: z.array(z.string()),
  items: z.array(newsItemSchema),
  meta: z.object({
    generatedAt: z.string(),
    sourcesOk: z.array(z.string()),
    sourcesFailed: z.array(z.object({ name: z.string(), error: z.string() })),
    totalFetched: z.number(),
    totalRelevant: z.number(),
  }),
});

export const newsSourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  region: z.enum([...REGIONS]).optional(),
  enabled: z.boolean(),
  authority: z.number().min(1).max(5).default(3),
  notes: z.string().optional(),
});
export const newsSourcesFileSchema = z.object({ sources: z.array(newsSourceSchema) });
