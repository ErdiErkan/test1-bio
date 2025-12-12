import { z } from 'zod'
import { CompetitionType, CompetitionScope, CompetitionStatus, Language } from '@prisma/client'

export const competitionTranslationSchema = z.object({
  language: z.nativeEnum(Language),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  rules: z.string().optional(),
  slug: z.string().min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

export const createCompetitionSchema = z.object({
  slug: z.string().min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  type: z.nativeEnum(CompetitionType),
  scope: z.nativeEnum(CompetitionScope),
  status: z.nativeEnum(CompetitionStatus).default('DRAFT'),

  // Dates can be strings from form input, need to be coerced/validated
  startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),

  coverImage: z.string().optional(),
  logoImage: z.string().optional(),

  publishedLanguages: z.array(z.nativeEnum(Language)).min(1, 'At least one language must be selected'),

  translations: z.array(competitionTranslationSchema).min(1, 'At least one translation is required')
})

export const updateCompetitionSchema = createCompetitionSchema.partial().extend({
  translations: z.array(competitionTranslationSchema.partial().required({ language: true })).optional()
})

export const addContestantSchema = z.object({
  competitionId: z.string().cuid(),
  celebrityId: z.string().cuid(),
})

export const updateRankingSchema = z.object({
  competitionId: z.string().cuid(),
  entries: z.array(z.object({
    id: z.string().cuid(),
    rank: z.number().int().min(1),
    placement: z.string().optional() // Will be cast to PlacementType in action
  }))
})

// Types inferred from Zod schemas
export type CompetitionTranslationForm = z.infer<typeof competitionTranslationSchema>
export type CreateCompetitionForm = z.infer<typeof createCompetitionSchema>
export type UpdateCompetitionForm = z.infer<typeof updateCompetitionSchema>
