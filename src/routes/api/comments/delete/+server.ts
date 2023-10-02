import type { ICommentDeleteBody } from '$lib/client/comments/types';
import { deleteCommentById } from '$lib/db/actions/comment';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to delete comments, without being a signed in user!'
		});
	}

	const { commentId }: ICommentDeleteBody = await request.json();
	if (!commentId) {
		throw error(400, {
			message: 'At least one of the required fields in the body for deleting a comment was missing!'
		});
	}

	const deletedComment = await deleteCommentById(commentId);
	if (!deletedComment) {
		throw error(400, { message: `A comment with the id: ${commentId} does not exist!` });
	}

	return new Response(
		JSON.stringify({ message: `A comment with the id: ${commentId} was deleted successfuly!` })
	);
};
