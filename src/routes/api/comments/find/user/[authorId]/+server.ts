import { PUBLIC_AUTHOR_COMMENT_SELECTIONS, findCommentsByAuthorId } from '$lib/db/actions/comment';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url }) => {
	const authorId = params.authorId;
	const pageNumber = url.searchParams.get('pageNumber');
	const pageLimit = url.searchParams.get('pageLimit');

	if (!authorId || !pageNumber || !pageLimit) {
		throw error(400, {
			message:
				'At least one of the required parameters was missing for finding the comments of a author!'
		});
	}

	const convertedPageNumber = parseInt(pageNumber);
	const convertedPageLimit = parseInt(pageLimit);
	if (isNaN(convertedPageNumber) || isNaN(convertedPageLimit)) {
		throw error(400, {
			message: 'The page number and the page limit parameters must be positive whole numbers!'
		});
	}

	const comments = await findCommentsByAuthorId(
		authorId,
		convertedPageNumber,
		convertedPageLimit,
		PUBLIC_AUTHOR_COMMENT_SELECTIONS
	);
	if (!comments) {
		throw error(400, { message: `There is no author with the id: ${authorId} that exists!` });
	}

	return new Response(JSON.stringify(comments));
};
