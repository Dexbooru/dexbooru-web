import {
	MAX_POSTS_PER_PAGE,
	PUBLIC_POST_SELECTORS,
	findPostsByAuthorId
} from '$lib/server/db/actions/post';
import { processPostPageParams } from '$lib/server/helpers/pagination';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/');
	}

	const { convertedAscending, convertedPageNumber, orderBy } = processPostPageParams(
		url.searchParams
	);

	const posts = await findPostsByAuthorId(
		convertedPageNumber,
		MAX_POSTS_PER_PAGE,
		locals.user.id,
		orderBy as TPostOrderByColumn,
		convertedAscending,
		PUBLIC_POST_SELECTORS
	);

	if (!posts) {
		throw error(404, { message: `A user with the id: ${locals.user.id} does not exist!` });
	}

	return {
		posts,
		pageNumber: convertedPageNumber,
		ascending: convertedAscending,
		orderBy: orderBy as TPostOrderByColumn
	};
};
