import type { RequestEvent } from '@sveltejs/kit';
import prisma from '../../db/prisma';
import { createSuccessResponse, validateAndHandleRequest } from '../../helpers/controllers';
import type { TControllerHandlerVariant, TRequestSchema } from '../../types/controllers';
import { CACHE_KEY, CACHE_TIME_SECONDS } from '../cache-strategies/general';
import { withRemoteCache } from '../strategies/withRemoteCache';

export type TResourceCounts = {
	postCount: number;
	collectionCount: number;
	tagCount: number;
	artistCount: number;
	userCount: number;
};

export const handleFetchResourceGenerics = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		{} satisfies TRequestSchema,
		async (_) => {
			const responseData = await withRemoteCache<TResourceCounts>({
				cacheKey: CACHE_KEY,
				ttlSeconds: CACHE_TIME_SECONDS,
				compute: async () => {
					const [postCount, collectionCount, tagCount, artistCount, userCount] = await Promise.all([
						prisma.post.count(),
						prisma.postCollection.count(),
						prisma.tag.count(),
						prisma.artist.count(),
						prisma.user.count(),
					]);

					return {
						postCount,
						collectionCount,
						tagCount,
						artistCount,
						userCount,
					};
				},
			});

			return createSuccessResponse(
				handlerType,
				'Successfully fetcheh generic application data',
				responseData,
			);
		},
	);
};
