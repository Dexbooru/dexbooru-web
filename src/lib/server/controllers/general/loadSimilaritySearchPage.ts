import { error, type RequestEvent } from '@sveltejs/kit';
import { validateAndHandleRequest } from '../../helpers/controllers';
import { getHealthCheck } from '../../helpers/mlApi';
import { cacheResponse } from '../../helpers/sessions';
import type { TRequestSchema } from '../../types/controllers';

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
