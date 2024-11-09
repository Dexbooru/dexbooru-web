import type { RequestEvent } from '@sveltejs/kit';
import prisma from '../db/prisma';
import { createSuccessResponse, validateAndHandleRequest } from '../helpers/controllers';
import type { TControllerHandlerVariant, TRequestSchema } from '../types/controllers';

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

			return createSuccessResponse(
				handlerType,
				'Successfully fetcheh generic application data',
				responseData,
			);
		},
	);
};
