import { MAX_POSTS_PER_PAGE, PUBLIC_POST_SELECTORS } from '$lib/server/constants/posts';
import { findPostsByPage } from '$lib/server/db/actions/post';
import { findLikedPostsFromSubset } from '$lib/server/db/actions/user';
import { processPostPageParams } from '$lib/server/helpers/pagination';
import type { IPost, TPostOrderByColumn } from '$lib/shared/types/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent }) => {
	const { user } = await parent();

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

	const likedPosts: IPost[] = user ? await findLikedPostsFromSubset(user.id, posts) : [];

	return {
		posts,
		likedPosts,
		pageNumber: convertedPageNumber,
		ascending: convertedAscending,
		orderBy: orderBy as TPostOrderByColumn
	};
};
