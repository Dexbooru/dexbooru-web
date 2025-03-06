import type { TRequestSchema } from '$lib/server/types/controllers';
import { z } from 'zod';

export const GetModerationDashboardSchema = {} satisfies TRequestSchema;
export const GetModeratorsSchema = {} satisfies TRequestSchema;

export const ModerationReviewStatusSchema = z.enum([
	'ACCEPTED',
	'REJECTED',
	'NOT_REVIEWED',
	'IN_REVIEW',
]);
