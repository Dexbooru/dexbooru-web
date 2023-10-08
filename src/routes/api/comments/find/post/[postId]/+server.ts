import {
	MAX_COMMENTS_PER_PAGE,
	PUBLIC_COMMENT_SELECTORS,
	findCommentsByPostId
} from '$lib/db/actions/comment';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url }) => {
	const postId = params.postId;
	const parentCommentId = url.searchParams.get('parentCommentId');
	const pageNumber = url.searchParams.get('pageNumber');

	if (!postId || !parentCommentId || !pageNumber) {
		throw error(400, {
			message:
				'At least one of the required parameters was missing for finding the comments of a post!'
		});
	}

	const convertedPageNumber = parseInt(pageNumber);

	if (isNaN(convertedPageNumber)) {
		throw error(400, {
			message: 'The page number parameter must be in a valid number format!'
		});
	}

	if (convertedPageNumber < 0) {
		throw error(400, { message: 'The page number must be a positive, whole number!' });
	}

	const comments = await findCommentsByPostId(
		postId,
		parentCommentId === 'null' ? null : parentCommentId,
		convertedPageNumber,
		MAX_COMMENTS_PER_PAGE,
		PUBLIC_COMMENT_SELECTORS
	);
	if (!comments) {
		throw error(400, { message: `There is no post with the id: ${postId} that exists!` });
	}

	return new Response(JSON.stringify(comments));
};
