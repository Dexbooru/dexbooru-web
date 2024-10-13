import type { ILikePutBody, IUpdatePostBody } from '$lib/shared/types/posts';
import { getApiAuthHeaders } from '../helpers/auth';

export const deletePost = async (postId: string): Promise<Response> => {
	return await fetch(`/api/post/${postId}`, {
		method: 'DELETE',
		headers: getApiAuthHeaders(),
	});
};

export const editPost = async (postId: string, body: IUpdatePostBody): Promise<Response> => {
	return await fetch(`/api/post/${postId}`, {
		method: 'PUT',
		body: JSON.stringify(body),
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
