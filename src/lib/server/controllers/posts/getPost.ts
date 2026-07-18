import {
	findPostById,
	findPostByIdWithUpdatedViewCount,
	findSimilarPosts,
	hasUserLikedPost,
} from '../../db/actions/post';
import { findUserPreferences } from '../../db/actions/preference';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import {
	cacheResponseRemotely,
	cacheToCollectionRemotely,
	getRemoteResponseFromCache,
} from '../../helpers/sessions';
import {
	CACHE_TIME_INDIVIDUAL_POST_SIMILARITY,
	getCacheKeyForIndividualPost,
	getCacheKeyForIndividualPostKeys,
	getCacheKeyForPostSimilarity,
	CACHE_TIME_INDIVIDUAL_POST_NOT_FOUND,
	CACHE_TIME_INDIVIDUAL_POST_FOUND,
} from '../cache-strategies/posts';
import { PUBLIC_POST_SELECTORS, PUBLIC_POST_SOURCE_SELECTORS } from '../../constants/posts';
import { PUBLIC_COMMENT_SELECTORS } from '../../constants/comments';
import { NULLABLE_USER, NULLABLE_USER_USER_PREFERENCES } from '$lib/shared/constants/auth';
import { isModerationRole } from '$lib/shared/helpers/auth/role';
import { GetPostSchema } from '../request-schemas/posts';
import logger from '../../logging/logger';
import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import type { TPost } from '$lib/shared/types/posts';
import { assignTagAndArtistEntities } from '../../helpers/postHydration';
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

		try {
			const cachedData = await getRemoteResponseFromCache<
				TPost | { post: TPost; similarPosts: TPost[]; similarities?: Record<string, number> }
			>(cacheKey);
			let post = cachedData ? ('post' in cachedData ? cachedData.post : cachedData) : null;

			if (post) {
				assignTagAndArtistEntities(post);
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

				const isModerator = user.id !== NULLABLE_USER.id && isModerationRole(user.role);

				post =
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

				assignTagAndArtistEntities(post);
				cacheResponseRemotely(cacheKey, post, CACHE_TIME_INDIVIDUAL_POST_FOUND);
			}

			if (handlerType === 'api-route') {
				return createSuccessResponse(
					handlerType,
					`Successfully fetched post with id: ${postId}`,
					post,
				);
			}

			const userPreferences =
				user.id === NULLABLE_USER.id
					? NULLABLE_USER_USER_PREFERENCES
					: await findUserPreferences(user.id);

			const similaritySelectors = {
				id: true,
				createdAt: true,
				tagString: true,
				artistString: true,
				imageUrls: true,
				isNsfw: true,
				sources: {
					select: PUBLIC_POST_SOURCE_SELECTORS,
				},
			};

			const similarityCacheKey = getCacheKeyForPostSimilarity(
				post.id,
				user.id === NULLABLE_USER.id ? null : user.id,
				{
					browseInSafeMode: userPreferences.browseInSafeMode,
					blacklistedTags: userPreferences.blacklistedTags,
					blacklistedArtists: userPreferences.blacklistedArtists,
				},
			);
			let cachedSimilarity = await getRemoteResponseFromCache<{
				similarPosts: TPost[];
				similarities: Record<string, number>;
			}>(similarityCacheKey);

			if (!cachedSimilarity) {
				const { posts: similarPosts, similarities } = await findSimilarPosts({
					postId: post.id,
					tagString: post.tagString,
					artistString: post.artistString,
					isNsfw: post.isNsfw,
					sources: post.sources,
					preferences: {
						browseInSafeMode: userPreferences.browseInSafeMode,
						blacklistedTags: userPreferences.blacklistedTags,
						blacklistedArtists: userPreferences.blacklistedArtists,
					},
					selectors: similaritySelectors,
				});
				similarPosts.forEach((similarPost) => assignTagAndArtistEntities(similarPost));
				cachedSimilarity = { similarPosts, similarities };
				cacheResponseRemotely(
					similarityCacheKey,
					cachedSimilarity,
					CACHE_TIME_INDIVIDUAL_POST_SIMILARITY,
				);
				cacheToCollectionRemotely(getCacheKeyForIndividualPostKeys(post.id), similarityCacheKey);
			}

			const hasLikedPost =
				user.id !== NULLABLE_USER.id ? await hasUserLikedPost(user.id, post.id) : false;
			const finalData = {
				post,
				similarPosts: cachedSimilarity.similarPosts.map((similarPost) => {
					assignTagAndArtistEntities(similarPost);
					return similarPost;
				}),
				similarities: cachedSimilarity.similarities,
				uploadedSuccessfully,
				hasLikedPost,
			};

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
