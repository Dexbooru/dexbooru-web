import { MAX_POSTS_PER_PAGE, PUBLIC_POST_SELECTORS } from '$lib/server/constants/posts';
import { findLikedPostsByAuthorId } from '$lib/server/db/actions/user';
import { processPostPageParams } from '$lib/server/helpers/pagination';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(302, '/');
	}

	const { convertedAscending, convertedPageNumber, orderBy } = processPostPageParams(
		url.searchParams
	);

	const posts =
		(await findLikedPostsByAuthorId(
			convertedPageNumber,
			MAX_POSTS_PER_PAGE,
			user.id,
			orderBy as TPostOrderByColumn,
			convertedAscending,
			PUBLIC_POST_SELECTORS
		)) || [];

	return {
		posts,
		likedPosts: posts,
		pageNumber: convertedPageNumber,
		ascending: convertedAscending,
		orderBy: orderBy as TPostOrderByColumn
	};
};
