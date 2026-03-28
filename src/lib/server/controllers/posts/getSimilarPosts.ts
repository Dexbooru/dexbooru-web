import { Buffer } from 'node:buffer';
import { findPostById } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { getSimilarPostsBySimilaritySearch } from '../../helpers/mlApi';
import { parseDexbooruMlErrorMessage } from '../../helpers/mlApiSimilarity';
import { DEFAULT_POST_IMAGE_SIMILARITY_TOP_K } from '$lib/shared/constants/postImageSimilarity';
import type { PostImageSimilaritySearchResponse } from '$lib/shared/types/postImageSimilarity';
import type { RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { GetSimilarPostsSchema } from '../request-schemas/posts';

function parseSimilarityImageDataUrl(dataUrl: string): {
	bytes: Uint8Array;
	contentType: string;
	filename: string;
} | null {
	const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl.trim());
	if (!match) {
		return null;
	}
	const mimePart = match[1];
	const b64Part = match[2];
	if (!mimePart || !b64Part) {
		return null;
	}
	const contentType = mimePart.trim();
	const buf = Buffer.from(b64Part, 'base64');
	const ext = contentType.split('/')[1]?.split('+')[0] ?? 'bin';
	return {
		bytes: new Uint8Array(buf),
		contentType,
		filename: `similarity-upload.${ext}`,
	};
}

export const handleGetSimilarPosts = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetSimilarPostsSchema,
		async (data) => {
			const { imageFile, imageUrl, postId, similarityDescription } = data.form;
			const providedFields = [imageFile, imageUrl, postId].filter((field) => field).length;
			if (providedFields !== 1) {
				return createErrorResponse(
					handlerType,
					400,
					'You must provide either an image file, an image url or a post id to get similar posts',
				);
			}

			const description = similarityDescription ?? undefined;
			const topClosestMatchCount = DEFAULT_POST_IMAGE_SIMILARITY_TOP_K;

			let mlRequest:
				| {
						kind: 'image_url';
						imageUrl: string;
						topClosestMatchCount: number;
						description?: string;
				  }
				| {
						kind: 'image_file';
						imageBytes: Uint8Array;
						filename: string;
						contentType: string;
						topClosestMatchCount: number;
						description?: string;
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

				const firstUrl = post.imageUrls[0];
				if (!firstUrl) {
					return createErrorResponse(handlerType, 400, 'That post has no images to search from');
				}

				mlRequest = {
					kind: 'image_url',
					imageUrl: firstUrl,
					topClosestMatchCount,
					description,
				};
			} else if (imageUrl && imageUrl.length > 0) {
				mlRequest = {
					kind: 'image_url',
					imageUrl,
					topClosestMatchCount,
					description,
				};
			} else if (imageFile && imageFile.length > 0) {
				const parsed = parseSimilarityImageDataUrl(imageFile);
				if (!parsed) {
					return createErrorResponse(
						handlerType,
						400,
						'The provided image file was not in the correct base64 data URL format',
					);
				}

				mlRequest = {
					kind: 'image_file',
					imageBytes: parsed.bytes,
					filename: parsed.filename,
					contentType: parsed.contentType,
					topClosestMatchCount,
					description,
				};
			} else {
				return createErrorResponse(
					handlerType,
					400,
					'You must provide either an image file, an image url or a post id to get similar posts',
				);
			}

			const response = await getSimilarPostsBySimilaritySearch(mlRequest);

			if (!response.ok) {
				const message = await parseDexbooruMlErrorMessage(response);
				const clientStatus =
					response.status >= 400 && response.status < 500 ? response.status : 502;
				return createErrorResponse(handlerType, clientStatus, message);
			}

			const responseData = (await response.json()) as PostImageSimilaritySearchResponse;

			return createSuccessResponse(handlerType, 'Successfully fetched similar posts', {
				results: responseData.results,
			});
		},
		handlerType === 'api-route',
	);
};
