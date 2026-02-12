import { findPostById } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { getSimilarPostsBySimilaritySearch } from '../../helpers/mlApi';
import type { TPostSimilarityBody, TPostSimilarityResponse } from '$lib/shared/types/posts';
import type { RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { GetSimilarPostsSchema } from '../request-schemas/posts';

export const handleGetSimilarPosts = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetSimilarPostsSchema,
		async (data) => {
			const { imageFile, imageUrl, postId } = data.form;
			const providedFields = [imageFile, imageUrl, postId].filter((field) => field).length;
			if (providedFields !== 1) {
				return createErrorResponse(
					handlerType,
					400,
					'You must provide either an image file, an image url or a post id to get similar posts',
				);
			}

			const requestBody: TPostSimilarityBody = {
				k: 10,
				distance_threshold: 0.35,
			};

			if (postId && postId.length > 0) {
				const post = await findPostById(postId, { imageUrls: true });
				if (!post) {
					return createErrorResponse(
						handlerType,
						404,
						`A post with the id: ${postId} does not exist`,
					);
				}

				requestBody.image_url = post.imageUrls[0];
			} else if (imageUrl && imageUrl.length > 0) {
				requestBody.image_url = imageUrl;
			} else if (imageFile && imageFile.length > 0) {
				const imageFileParts = imageFile.split(',');
				if (imageFileParts.length !== 2) {
					return createErrorResponse(
						handlerType,
						400,
						'The provided image file was not in the correct base64 format',
					);
				}

				requestBody.image_file = imageFileParts[1];
			}

			const response = await getSimilarPostsBySimilaritySearch(requestBody);
			if (!response.ok) {
				return createErrorResponse(handlerType, 500, 'An error occurred while calling the ML api');
			}

			const responseData: TPostSimilarityResponse = await response.json();
			const results = responseData.results;

			return createSuccessResponse(handlerType, 'Successfully fetched similar posts', { results });
		},
		handlerType === 'api-route',
	);
};
