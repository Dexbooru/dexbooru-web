import { buildUrl } from '$lib/shared/helpers/urls';

export const getComments = async (
	postId: string,
	parentCommentId: string | null,
	pageNumber: number
): Promise<Response> => {
	const params = {
		pageNumber,
		parentCommentId: parentCommentId === null ? 'null' : parentCommentId
	};

	const finalUrl = buildUrl(`/api/comments/find/post/${postId}`, params);
	return await fetch(finalUrl);
};
