import {
	MAX_POSTS_PER_PAGE,
	PUBLIC_POST_SELECTORS,
	findPostsByAuthorId
} from '$lib/server/db/actions/post';
import { findLikedPostsFromSubset } from '$lib/server/db/actions/user';
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
		(await findPostsByAuthorId(
			convertedPageNumber,
			MAX_POSTS_PER_PAGE,
			user.id,
			orderBy as TPostOrderByColumn,
			convertedAscending,
			PUBLIC_POST_SELECTORS
		)) || [];

	const likedPosts = user ? await findLikedPostsFromSubset(user.id, posts) : [];

	return {
		posts,
		likedPosts,
		pageNumber: convertedPageNumber,
		ascending: convertedAscending,
		orderBy: orderBy as TPostOrderByColumn
	};
};
