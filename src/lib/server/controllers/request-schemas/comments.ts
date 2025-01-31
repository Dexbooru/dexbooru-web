import { PageNumberSchema, BoolStrSchema } from "$lib/server/constants/reusableSchemas";
import type { TRequestSchema } from "$lib/server/types/controllers";
import { MAXIMUM_CONTENT_LENGTH } from "$lib/shared/constants/comments";
import { z } from "zod";

const GeneralCommentsSchema = {
	urlSearchParams: z.object({
		pageNumber: PageNumberSchema,
		ascending: BoolStrSchema,
		orderBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
	}),
} satisfies TRequestSchema;

const DeletePostCommentsSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	urlSearchParams: z.object({
		commentId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const EditPostCommentsSchmea = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		commentId: z.string().uuid(),
		content: z
			.string()
			.trim()
			.min(1, 'The comment content cannot be empty')
			.refine((val) => val.length <= MAXIMUM_CONTENT_LENGTH, {
				message: `The maximum content length for a comment is: ${MAXIMUM_CONTENT_LENGTH} characters`,
			}),
	}),
} satisfies TRequestSchema;

const GetPostCommentsSchema = {
	urlSearchParams: z.object({
		pageNumber: PageNumberSchema,
		parentCommentId: z.string().optional().default('null'),
	}),
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const CreateCommentSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		parentCommentId: z.union([z.string(), z.null()]),
		content: z
			.string()
			.trim()
			.min(1, 'The comment content cannot be empty')
			.refine((val) => val.length <= MAXIMUM_CONTENT_LENGTH, {
				message: `The maximum content length for a comment is: ${MAXIMUM_CONTENT_LENGTH} characters`,
			}),
	}),
} satisfies TRequestSchema;

export {
	CreateCommentSchema,
	DeletePostCommentsSchema,
	EditPostCommentsSchmea,
	GeneralCommentsSchema,
	GetPostCommentsSchema,
};
