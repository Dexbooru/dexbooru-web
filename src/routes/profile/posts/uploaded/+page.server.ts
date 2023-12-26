import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	MAX_POSTS_PER_PAGE,
	PUBLIC_POST_SELECTORS,
	findPostsByAuthorId
} from '$lib/server/db/actions/post';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/');
	}

	const pageNumber = url.searchParams.get('pageNumber') || '0';
	const convertedPageNumber = parseInt(pageNumber);

	if (isNaN(convertedPageNumber)) {
		throw error(400, {
			message: 'The page number parameter must be in a valid number format!'
		});
	}

	if (convertedPageNumber < 0) {
		throw error(400, { message: 'The page number parameter must be a positive, whole number!' });
	}

	const posts = await findPostsByAuthorId(
		convertedPageNumber,
		MAX_POSTS_PER_PAGE,
		locals.user.id,
		PUBLIC_POST_SELECTORS
	);

	if (!posts) {
		throw error(404, { message: `A user with the id: ${locals.user.id} does not exist!` });
	}

	return {
		posts,
		pageNumber: convertedPageNumber
	};
};
