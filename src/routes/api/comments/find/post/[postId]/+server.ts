import { PUBLIC_COMMENT_SELECTORS, findCommentsByPostId } from '$lib/db/actions/comment';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url }) => {
	const postId = params.postId;
	const parentCommentId = url.searchParams.get('parentCommentId');
	const pageNumber = url.searchParams.get('pageNumber');
	const pageLimit = url.searchParams.get('pageLimit');

	if (!postId || !parentCommentId || !pageNumber || !pageLimit) {
		throw error(400, {
			message:
				'At least one of the required parameters was missing for finding the comments of a post!'
		});
	}

	const convertedPageNumber = parseInt(pageNumber);
	const convertedPageLimit = parseInt(pageLimit);
	if (isNaN(convertedPageNumber) || isNaN(convertedPageLimit)) {
		throw error(400, {
			message: 'The page number and the page limit parameters must be positive whole numbers!'
		});
	}

	const comments = await findCommentsByPostId(
		postId,
		parentCommentId === 'null' ? null : parentCommentId,
		convertedPageNumber,
		convertedPageLimit,
		PUBLIC_COMMENT_SELECTORS
	);
	if (!comments) {
		throw error(400, { message: `There is no post with the id: ${postId} that exists!` });
	}

	return new Response(JSON.stringify(comments));
};
