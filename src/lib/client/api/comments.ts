import { buildUrl } from '$lib/client/helpers/urls';
import type { TCommentCreateBody } from '$lib/shared/types/comments';

export const editComment = async (postId: string, commentId: string, updatedContnet: string) => {
	return await fetch(`/api/post/${postId}/comments`, {
		method: 'PUT',
		body: JSON.stringify({
			commentId,
			content: updatedContnet,
		}),
	});
};

export const deleteComment = async (postId: string, commentId: string) => {
	const params = { commentId };
	const url = buildUrl(`/api/post/${postId}/comments`, params);

	return await fetch(url, {
		method: 'DELETE',
	});
};

export const getComments = async (
	postId: string,
	parentCommentId: string | null,
	pageNumber: number,
): Promise<Response> => {
	const params = {
		pageNumber,
		parentCommentId: parentCommentId === null ? 'null' : parentCommentId,
	};

	const finalUrl = buildUrl(`/api/post/${postId}/comments`, params);
	return await fetch(finalUrl);
};

export const createComment = async (postId: string, body: TCommentCreateBody) => {
	return await fetch(`/api/post/${postId}/comments`, {
		method: 'POST',
		body: JSON.stringify(body),
	});
};
