import { error, type RequestEvent } from '@sveltejs/kit';
import prisma from '../db/prisma';
import { createSuccessResponse, validateAndHandleRequest } from '../helpers/controllers';
import { getHealthCheck } from '../helpers/mlApi';
import { cacheResponse } from '../helpers/sessions';
import type { TControllerHandlerVariant, TRequestSchema } from '../types/controllers';

export const handleLoadSimilaritySearchPage = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		{} satisfies TRequestSchema,
		async (_) => {
			const response = await getHealthCheck();
			if (!response.ok) {
				error(500, 'The Dexbooru ML');
			}

			cacheResponse(event.setHeaders, 120);
		},
	);
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
			const [postCount, collectionCount, tagCount, artistCount, userCount] = await Promise.all([
				prisma.post.count(),
				prisma.postCollection.count(),
				prisma.tag.count(),
				prisma.artist.count(),
				prisma.user.count(),
			]);
			const responseData = {
				postCount,
				collectionCount,
				tagCount,
				artistCount,
				userCount,
			};

			cacheResponse(event.setHeaders, 60);

			return createSuccessResponse(
				handlerType,
				'Successfully fetcheh generic application data',
				responseData,
			);
		},
	);
};
