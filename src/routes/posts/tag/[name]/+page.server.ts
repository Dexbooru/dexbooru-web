import { MAX_POSTS_PER_PAGE, PUBLIC_POST_SELECTORS } from '$lib/server/db/actions/post';
import { findPostsByTagName } from '$lib/server/db/actions/tag';
import { findLikedPostsFromSubset } from '$lib/server/db/actions/user';
import { processPostPageParams } from '$lib/server/helpers/pagination';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, parent }) => {
	const { user } = await parent();

	const tagName = params.name;
	const { convertedAscending, orderBy, convertedPageNumber } = processPostPageParams(
		url.searchParams
	);

	const posts = await findPostsByTagName(
		tagName,
		convertedPageNumber,
		MAX_POSTS_PER_PAGE,
		orderBy as TPostOrderByColumn,
		convertedAscending,
		PUBLIC_POST_SELECTORS
	);

	const likedPosts = user ? await findLikedPostsFromSubset(user.id, posts) : [];

	return {
		posts,
		likedPosts,
		pageNumber: convertedPageNumber,
		ascending: convertedAscending,
		orderBy: orderBy as TPostOrderByColumn
	};
};
