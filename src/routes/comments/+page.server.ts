import { handleGetGeneralComments } from '$lib/server/controllers/comments';
import type { TCommentPaginationData } from '$lib/shared/types/comments';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	return (await handleGetGeneralComments(event, 'page-server-load')) as TCommentPaginationData;
};
