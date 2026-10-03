import type { TLikePutBody, TUpdatePostBody } from '$lib/shared/types/posts';
import type { TSauceNaoSuggestionsResponse } from '$lib/shared/types/sauceNao';
import { getApiAuthHeaders } from '../helpers/auth';

type TApiResponse<T> = {
	status: number;
	message: string;
	data: T;
};

export const deletePost = async (postId: string): Promise<Response> => {
	return await fetch(`/api/post/${postId}`, {
		method: 'DELETE',
	});
};

export const editPost = async (postId: string, body: TUpdatePostBody): Promise<Response> => {
	return await fetch(`/api/post/${postId}`, {
		method: 'PATCH',
		body: JSON.stringify(body),
	});
};

export const likePost = async (postId: string, body: TLikePutBody): Promise<Response> => {
	return await fetch(`/api/post/${postId}/like`, {
		method: 'PUT',
		body: JSON.stringify(body),
	});
};

export const checkDuplicatePosts = async (hashes: string[]): Promise<Response> => {
	return await fetch('/api/posts/duplicates', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ hashes }),
	});
};

export const fetchSourceSuggestions = async (
	file: File,
	options?: { signal?: AbortSignal },
): Promise<TSauceNaoSuggestionsResponse> => {
	const body = new FormData();
	body.append('image', file);
	const response = await fetch('/api/posts/source-suggestions', {
		method: 'POST',
		headers: getApiAuthHeaders(),
		body,
		signal: options?.signal,
	});
	const payload = (await response.json()) as TApiResponse<TSauceNaoSuggestionsResponse>;
	if (!response.ok || !payload?.data) {
		throw new Error(payload?.message ?? 'Failed to fetch source suggestions.');
	}
	return payload.data;
};
