import { MAXIMUM_COLLECTION_TITLE_LENGTH } from '$lib/shared/constants/collections';
import { MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB } from '$lib/shared/constants/images';
import { MAXIMUM_DESCRIPTION_LENGTH } from '$lib/shared/constants/labels';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { createErrorResponse, validateAndHandleRequest } from '../helpers/controllers';
import type { TRequestSchema } from '../types/controllers';

const CreateCollectionSchema = {
	form: z.object({
		title: z
			.string()
			.min(1, 'The title cannot be empty')
			.max(MAXIMUM_COLLECTION_TITLE_LENGTH, {
				message: `The maximum collection title length is ${MAXIMUM_COLLECTION_TITLE_LENGTH}`,
			}),
		description: z
			.string()
			.min(1, 'The description cannot be empty')
			.max(MAXIMUM_DESCRIPTION_LENGTH, {
				message: `The maximum collection description length is ${MAXIMUM_DESCRIPTION_LENGTH}`,
			}),
		thumbnail: z
			.instanceof(globalThis.File)
			.refine(
				(val) => {
					return isFileImageSmall(val) && isFileImage(val);
				},
				{
					message: `The provided collection thumbnail exceeded the maximum size of ${MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB} mb`,
				},
			)
			.optional(),
	}),
} satisfies TRequestSchema;

export const handleCreateCollection = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		CreateCollectionSchema,
		async (data) => {
			// const { title, description, thumbnail } = data.form;
			try {
				console.log(data);
			} catch {
				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while trying to create the post collection',
				);
			}
		},
		true,
	);
};
