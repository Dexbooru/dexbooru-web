import type { ILikePutBody } from '$lib/shared/types/posts';
import { getApiAuthHeaders } from '../helpers/auth';

export const deletePost = async (postId: string): Promise<Response> => {
	return await fetch(`/api/post/${postId}`, {
		method: 'DELETE',
		headers: getApiAuthHeaders(),
	});
};

export const likePost = async (postId: string, body: ILikePutBody): Promise<Response> => {
	return await fetch(`/api/post/${postId}/like`, {
		method: 'PUT',
		body: JSON.stringify(body),
		headers: getApiAuthHeaders(),
	});
};
