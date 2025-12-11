import { z } from 'zod';
import { CompetitionType, CompetitionScope, CompetitionStatus } from '@prisma/client';

// Translation schema
const competitionTranslationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  slug: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  seoContent: z.string().max(50000).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

// Main competition schema
export const createCompetitionSchema = z.object({
  common: z.object({
    type: z.nativeEnum(CompetitionType),
    scope: z.nativeEnum(CompetitionScope),
    year: z.number().int().min(1900).max(2100),
    edition: z.number().int().positive().optional(),
    eventDate: z.string().optional(),
    country: z.string().length(2).optional(), // ISO code
    city: z.string().max(100).optional(),
    venue: z.string().max(255).optional(),
    coverImage: z.string().url().optional().or(z.literal('')),
    logoImage: z.string().url().optional().or(z.literal('')),
    categoryIds: z.array(z.string()).optional(),
    publishedLanguages: z.array(z.string()).optional(),
    status: z.nativeEnum(CompetitionStatus).optional(),
    isFeatured: z.boolean().optional(),
  }),
  translations: z.record(z.string(), competitionTranslationSchema.optional())
});

// Add contestant schema
export const addContestantSchema = z.object({
  celebrityId: z.string().min(1, 'Celebrity is required'),
  rank: z.number().int().min(0),
  placement: z.string().max(100).optional(),
  representingCountry: z.string().length(2).optional(),
  specialAwards: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
});

// Update rankings schema
export const updateRankingsSchema = z.array(z.object({
  entryId: z.string(),
  rank: z.number().int().min(0),
  placement: z.string().max(100).optional(),
}));

// Export types
export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type AddContestantInput = z.infer<typeof addContestantSchema>;
export type UpdateRankingsInput = z.infer<typeof updateRankingsSchema>;
