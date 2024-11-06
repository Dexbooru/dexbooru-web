import { handleGetCollection } from '$lib/server/controllers/collections';
import type { TPostCollection } from '$lib/shared/types/collections';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const collection = (await handleGetCollection(event, 'page-server-load')) as TPostCollection;
	return {
		collection,
	};
};
