import { createComment } from '$lib/server/db/actions/comment';
import { MAXIMUM_CONTENT_LENGTH } from '$lib/shared/constants/comments';
import type { ICommentCreateBody } from '$lib/shared/types/comments';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to create comments, without being a signed in user!'
		});
	}

	const { authorId, postId, parentCommentId, content }: ICommentCreateBody = await request.json();
	if (!authorId || !postId || parentCommentId === undefined || !content) {
		throw error(400, {
			message: 'At least one of the required fields in the body for creating a comment was missing!'
		});
	}

	if (content.length > MAXIMUM_CONTENT_LENGTH) {
		throw error(400, {
			message: 'The maximum content length of a comment was exceeded!'
		});
	}

	const { id: commentId } = await createComment(authorId, postId, content, parentCommentId);
	return new Response(
		JSON.stringify({
			message: `A new comment with the id: ${commentId} was created for the post with the id: ${postId} by an author with the id: ${authorId}!`
		})
	);
};
