import type { ICommentEditBody } from '$lib/client/comments/types';
import { editCommentContentById } from '$lib/db/actions/comment';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to edit comments, without being a signed in user!'
		});
	}

	const { commentId, updatedContent }: ICommentEditBody = await request.json();
	if (!commentId || !updatedContent) {
		throw error(400, {
			message: 'At least one of the required fields in the body for deleting a comment was missing!'
		});
	}

	const editedComment = await editCommentContentById(commentId, locals.user.id, updatedContent);
	if (!editedComment) {
		throw error(400, {
			message: `A comment with the id: ${commentId} does either not exist or the user with id: ${locals.user.id} is not the original author!`
		});
	}

	return new Response(
		JSON.stringify({
			message: `A comment with the id: ${commentId} had its content set to: ${updatedContent} successfully!`
		})
	);
};
