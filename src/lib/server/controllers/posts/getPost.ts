import {
	findPostById,
	findPostByIdWithUpdatedViewCount,
	findSimilarPosts,
	hasUserLikedPost,
} from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { getRemoteResponseFromCache, cacheResponseRemotely } from '../../helpers/sessions';
import {
	getCacheKeyForIndividualPost,
	CACHE_TIME_INDIVIDUAL_POST_NOT_FOUND,
	CACHE_TIME_INDIVIDUAL_POST_FOUND,
} from '../cache-strategies/posts';
import { PUBLIC_POST_SELECTORS, PUBLIC_POST_SOURCE_SELECTORS } from '../../constants/posts';
import { PUBLIC_COMMENT_SELECTORS } from '../../constants/comments';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { isModerationRole } from '$lib/shared/helpers/auth/role';
import { GetPostSchema } from '../request-schemas/posts';
import logger from '../../logging/logger';
import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import type { TPost } from '$lib/shared/types/posts';
import { throwPostNotFoundError } from './helpers';

export const handleGetPost = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetPostSchema, async (data) => {
		const postId = data.pathParams.postId;
		const uploadedSuccessfully = data.urlSearchParams.uploadedSuccessfully === 'true';
		const user = event.locals.user;

		const cacheKey = getCacheKeyForIndividualPost(postId);
		let finalData:
			| TPost
			| {
					post: TPost;
					similarPosts: TPost[];
					similarities?: Record<string, number>;
					uploadedSuccessfully?: boolean;
					hasLikedPost?: boolean;
			  };

		try {
			const cachedData = await getRemoteResponseFromCache<
				| TPost
				| {
						post: TPost;
						similarPosts: TPost[];
						similarities?: Record<string, number>;
						uploadedSuccessfully?: boolean;
						hasLikedPost?: boolean;
				  }
			>(cacheKey);

			if (cachedData) {
				if (cachedData === null) {
					return throwPostNotFoundError(handlerType, postId);
				}

				if ('post' in cachedData && 'similarPosts' in cachedData) {
					finalData = cachedData;
					finalData.uploadedSuccessfully = uploadedSuccessfully;
				} else {
					finalData = cachedData as TPost;
				}
			} else {
				const selectors = {
					...PUBLIC_POST_SELECTORS,
					comments: {
						select: PUBLIC_COMMENT_SELECTORS,
					},
					sources: {
						select: PUBLIC_POST_SOURCE_SELECTORS,
					},
				};
				const similaritySelectors = {
					id: true,
					tagString: true,
					artistString: true,
					imageUrls: true,
				};

				const isModerator = user.id !== NULLABLE_USER.id && isModerationRole(user.role);

				let post =
					handlerType === 'api-route'
						? await findPostById(postId, selectors)
						: await findPostByIdWithUpdatedViewCount(postId, selectors);

				if (!post && user.id !== NULLABLE_USER.id) {
					const rejectedPost = await findPostById(postId, { authorId: true }, [
						'PENDING',
						'APPROVED',
						'REJECTED',
					]);
					if (rejectedPost && (isModerator || rejectedPost.authorId === user.id)) {
						post =
							handlerType === 'api-route'
								? await findPostById(postId, selectors, ['PENDING', 'APPROVED', 'REJECTED'])
								: await findPostByIdWithUpdatedViewCount(postId, selectors, [
										'PENDING',
										'APPROVED',
										'REJECTED',
									]);
					}
				}

				if (!post) {
					cacheResponseRemotely(cacheKey, null, CACHE_TIME_INDIVIDUAL_POST_NOT_FOUND);
					return throwPostNotFoundError(handlerType, postId);
				}

				post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
				post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));

				const { posts: similarPosts, similarities } = await findSimilarPosts(
					post.id,
					post.tagString,
					post.artistString,
					similaritySelectors,
				);
				similarPosts.forEach((similarPost) => {
					similarPost.tags = similarPost.tagString.split(',').map((tag) => ({ name: tag }));
					similarPost.artists = similarPost.artistString
						.split(',')
						.map((artist) => ({ name: artist }));
				});

				const hasLikedPost =
					user.id !== NULLABLE_USER.id ? await hasUserLikedPost(user.id, post.id) : false;

				finalData =
					handlerType === 'api-route'
						? post
						: { post, similarPosts, similarities, uploadedSuccessfully, hasLikedPost };

				cacheResponseRemotely(cacheKey, finalData, CACHE_TIME_INDIVIDUAL_POST_FOUND);
			}

			return createSuccessResponse(
				handlerType,
				`Successfully fetched post with id: ${postId}`,
				finalData,
			);
		} catch (error) {
			if (isHttpError(error)) throw error;

			logger.error(error);

			const errorResponse = createErrorResponse(
				handlerType,
				500,
				'An error occurred while fetching the post',
			);
			if (handlerType === 'page-server-load') throw errorResponse;

			return errorResponse;
		}
	});
};
