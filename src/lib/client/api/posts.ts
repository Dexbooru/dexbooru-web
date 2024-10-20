import type { TLikePutBody, TUpdatePostBody } from '$lib/shared/types/posts';
import { getApiAuthHeaders } from '../helpers/auth';

export const deletePost = async (postId: string): Promise<Response> => {
	return await fetch(`/api/post/${postId}`, {
		method: 'DELETE',
		headers: getApiAuthHeaders(),
	});
};

export const editPost = async (postId: string, body: TUpdatePostBody): Promise<Response> => {
	return await fetch(`/api/post/${postId}`, {
		method: 'PUT',
		body: JSON.stringify(body),
		headers: getApiAuthHeaders(),
	});
};

export const likePost = async (postId: string, body: TLikePutBody): Promise<Response> => {
	return await fetch(`/api/post/${postId}/like`, {
		method: 'PUT',
		body: JSON.stringify(body),
		headers: getApiAuthHeaders(),
	});
};
