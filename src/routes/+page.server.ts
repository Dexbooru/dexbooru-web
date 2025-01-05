import { handleFetchResourceGenerics } from '$lib/server/controllers/general';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return (await handleFetchResourceGenerics(event, 'page-server-load')) as {
		postCount: number;
		collectionCount: number;
		tagCount: number;
		artistCount: number;
		userCount: number;
	};
};
