import { NULLABLE_USER, NULLABLE_USER_USER_PREFERENCES } from '$lib/shared/constants/auth';
import { isModerationRole } from '$lib/shared/helpers/auth/role';
import type { TPost } from '$lib/shared/types/posts';
import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import { PUBLIC_COMMENT_SELECTORS } from '../../constants/comments';
import { PUBLIC_POST_SELECTORS, PUBLIC_POST_SOURCE_SELECTORS } from '../../constants/posts';
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
import { assignTagAndArtistEntities } from '../../helpers/postHydration';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import {
	CACHE_TIME_INDIVIDUAL_POST_FOUND,
	CACHE_TIME_INDIVIDUAL_POST_NOT_FOUND,
	CACHE_TIME_INDIVIDUAL_POST_SIMILARITY,
	getCacheKeyForIndividualPost,
	getCacheKeyForIndividualPostKeys,
	getCacheKeyForPostSimilarity,
} from '../cache-strategies/posts';
import { GetPostSchema } from '../request-schemas/posts';
import { withRemoteCache } from '../strategies/withRemoteCache';
import { throwPostNotFoundError } from './helpers';

type TLegacyCachedPostPayload = {
	post: TPost;
	similarPosts?: TPost[];
	similarities?: Record<string, number>;
};

type TCachedIndividualPost = TPost | TLegacyCachedPostPayload | { notFound: true };

const isNotFoundCacheEntry = (value: TCachedIndividualPost): value is { notFound: true } => {
	return 'notFound' in value && value.notFound === true;
};

const isLegacyCachedPostPayload = (
	value: TCachedIndividualPost,
): value is TLegacyCachedPostPayload => {
	return (
		!isNotFoundCacheEntry(value) &&
		'post' in value &&
		typeof value.post === 'object' &&
		value.post !== null &&
		'tagString' in value.post
	);
};

const resolvePostFromCacheEntry = (value: TCachedIndividualPost): TPost | null => {
	if (isNotFoundCacheEntry(value)) return null;
	if (isLegacyCachedPostPayload(value)) return value.post;
	return value;
};

const loadPostForRequest = async (
	postId: string,
	handlerType: TControllerHandlerVariant,
	user: RequestEvent['locals']['user'],
): Promise<TPost | null> => {
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

	return post;
};

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
			const cachedResult = await withRemoteCache<TCachedIndividualPost>({
				cacheKey,
				ttlSeconds: CACHE_TIME_INDIVIDUAL_POST_FOUND,
				resolveTtl: (value) =>
					isNotFoundCacheEntry(value)
						? CACHE_TIME_INDIVIDUAL_POST_NOT_FOUND
						: CACHE_TIME_INDIVIDUAL_POST_FOUND,
				compute: async () => {
					const loadedPost = await loadPostForRequest(postId, handlerType, user);
					if (!loadedPost) {
						return { notFound: true as const };
					}

					assignTagAndArtistEntities(loadedPost);
					return loadedPost;
				},
			});

			if (isNotFoundCacheEntry(cachedResult)) {
				return throwPostNotFoundError(handlerType, postId);
			}

			const post = resolvePostFromCacheEntry(cachedResult);
			if (!post) {
				return throwPostNotFoundError(handlerType, postId);
			}

			assignTagAndArtistEntities(post);

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
			const cachedSimilarity = await withRemoteCache<{
				similarPosts: TPost[];
				similarities: Record<string, number>;
			}>({
				cacheKey: similarityCacheKey,
				ttlSeconds: CACHE_TIME_INDIVIDUAL_POST_SIMILARITY,
				getAssociateKeys: () => [getCacheKeyForIndividualPostKeys(post.id)],
				compute: async () => {
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
					return { similarPosts, similarities };
				},
			});

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
