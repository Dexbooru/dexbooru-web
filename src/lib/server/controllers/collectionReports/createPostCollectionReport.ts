import { findCollectionById } from '../../db/actions/collection';
import { createPostCollectionReport } from '../../db/actions/collectionReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { CreatePostCollectionReportSchema } from '../request-schemas/collectionReports';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';

export const handleCreatePostCollectionReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreatePostCollectionReportSchema,
		async (data) => {
			const collectionId = data.pathParams.collectionId;
			const { description, category } = data.body;

			try {
				const collection = await findCollectionById(collectionId, { id: true });
				if (!collection) {
					return createErrorResponse(
						'api-route',
						404,
						'The post collection you are trying to report does not exist.',
					);
				}

				const newPostCollectionReport = await createPostCollectionReport({
					description,
					category,
					postCollectionId: collection.id,
				});

				return createSuccessResponse(
					'api-route',
					'Successfully created the post collection report.',
					{ newPostCollectionReport },
					201,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while creating the post collection report.',
				);
			}
		},
	);
};
