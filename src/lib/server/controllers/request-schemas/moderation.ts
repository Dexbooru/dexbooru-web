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

export const PostModerationStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const GetPendingPostsSchema = {
	urlSearchParams: z.object({
		pageNumber: z.coerce.number().default(0),
	}),
} satisfies TRequestSchema;

export const UpdatePostModerationStatusSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		status: PostModerationStatusSchema,
	}),
} satisfies TRequestSchema;

export const UserModerationStatusSchema = z.enum(['FLAGGED', 'UNFLAGGED']);
export const CollectionModerationStatusSchema = z.enum(['FLAGGED', 'UNFLAGGED']);

export const OwnerResourceModerationStatusGetSchema = {
	urlSearchParams: z.object({
		resourceType: z.enum(['post', 'user', 'postCollection']),
		resourceId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

export const OwnerAmendResourceModerationSchema = {
	body: z.discriminatedUnion('resourceType', [
		z.object({
			resourceType: z.literal('post'),
			resourceId: z.string().uuid(),
			status: PostModerationStatusSchema,
		}),
		z.object({
			resourceType: z.literal('user'),
			resourceId: z.string().uuid(),
			status: UserModerationStatusSchema,
		}),
		z.object({
			resourceType: z.literal('postCollection'),
			resourceId: z.string().uuid(),
			status: CollectionModerationStatusSchema,
		}),
	]),
} satisfies TRequestSchema;
