import {
	MAX_POSTS_PER_PAGE,
	PUBLIC_POST_SELECTORS,
	findPostsByPage
} from '$lib/server/db/actions/post';
import { processPostPageParams } from '$lib/server/helpers/pagination';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const { convertedAscending, orderBy, convertedPageNumber } = processPostPageParams(
		url.searchParams
	);

	const posts = await findPostsByPage(
		convertedPageNumber,
		MAX_POSTS_PER_PAGE,
		orderBy as TPostOrderByColumn,
		convertedAscending,
		PUBLIC_POST_SELECTORS
	);

	return {
		posts,
		pageNumber: convertedPageNumber,
		ascending: convertedAscending,
		orderBy: orderBy as TPostOrderByColumn
	};
};
