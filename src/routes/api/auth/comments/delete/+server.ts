import type { ICommentDeleteBody } from '$lib/shared/types/comments';
import { deleteCommentById } from '$lib/server/db/actions/comment';
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

	const deletedComment = await deleteCommentById(commentId, locals.user.id);
	if (!deletedComment) {
		throw error(404, {
			message: `A comment with the id: ${commentId} does not exist or the user with id: ${locals.user.id} is not the original author of the comment!`
		});
	}

	return new Response(
		JSON.stringify({
			message: `A comment with the id: ${commentId} and its corresponding replies were deleted successfuly!`
		})
	);
};
