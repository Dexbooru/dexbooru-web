import type { RequestEvent } from '@sveltejs/kit';
import prisma from '../../db/prisma';
import { createSuccessResponse, validateAndHandleRequest } from '../../helpers/controllers';
import { cacheResponseRemotely, getRemoteResponseFromCache } from '../../helpers/sessions';
import type { TControllerHandlerVariant, TRequestSchema } from '../../types/controllers';
import { CACHE_KEY, CACHE_TIME_SECONDS } from '../cache-strategies/general';

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
			let responseData: TResourceCounts;
			const cachedCounts = await getRemoteResponseFromCache<TResourceCounts>(CACHE_KEY);

			if (cachedCounts) {
				responseData = cachedCounts;
			} else {
				const [postCount, collectionCount, tagCount, artistCount, userCount] = await Promise.all([
					prisma.post.count(),
					prisma.postCollection.count(),
					prisma.tag.count(),
					prisma.artist.count(),
					prisma.user.count(),
				]);
				responseData = {
					postCount,
					collectionCount,
					tagCount,
					artistCount,
					userCount,
				};

				cacheResponseRemotely(CACHE_KEY, responseData, CACHE_TIME_SECONDS);
			}

			return createSuccessResponse(
				handlerType,
				'Successfully fetcheh generic application data',
				responseData,
			);
		},
	);
};
