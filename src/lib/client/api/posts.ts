import type { IDeletePostBody, ILikePostBody } from '$lib/shared/types/posts';

export const deletePost = async (body: IDeletePostBody): Promise<Response> => {
	return await fetch('/api/auth/posts/delete', {
		method: 'DELETE',
		body: JSON.stringify(body)
	});
};

export const likePost = async (body: ILikePostBody): Promise<Response> => {
	return await fetch('/api/auth/posts/like', {
		method: 'POST',
		body: JSON.stringify(body)
	});
};
