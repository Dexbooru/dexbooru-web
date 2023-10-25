import {
	VALID_ORDERBY_COLUMNS,
	findPostsByPage,
	MAX_POSTS_PER_PAGE,
	PUBLIC_POST_SELECTORS
} from '$lib/server/db/actions/post';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';

export const load: PageServerLoad = async ({ url }) => {
	const pageNumber = url.searchParams.get('pageNumber') || '0';
	const orderBy = url.searchParams.get('orderBy') || 'createdAt';
	const ascending = url.searchParams.get('ascending') || 'false';

	const convertedPageNumber = parseInt(pageNumber);

	if (isNaN(convertedPageNumber)) {
		throw error(400, {
			message: 'The page number parameter must be in a valid number format!'
		});
	}

	if (convertedPageNumber < 0) {
		throw error(400, { message: 'The page number parameter must be a positive, whole number!' });
	}

	if (!VALID_ORDERBY_COLUMNS.includes(orderBy as TPostOrderByColumn)) {
		throw error(400, {
			message: `The order by parameter must be one of: ${VALID_ORDERBY_COLUMNS.join(', ')}!`
		});
	}

	if (ascending !== 'true' && ascending !== 'false') {
		throw error(400, { message: 'The ascending parameter must be either true or false!' });
	}

	const convertedAscending = ascending === 'true' ? true : false;

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
