import { POST_ID_URL_PARAMETER_NAME } from '$lib/shared/constants/posts';
import { buildUrl } from '$lib/shared/helpers/urls';
import type { ILikePostBody } from '$lib/shared/types/posts';

export const deletePost = async (postId: string): Promise<Response> => {
	const params = {
		[POST_ID_URL_PARAMETER_NAME]: postId,
	}

	const finalUrl = buildUrl('/api/post', params);
	return await fetch(finalUrl, {
		method: 'DELETE',
	});
};

export const likePost = async (body: ILikePostBody): Promise<Response> => {
	return await fetch('/api/posts/like', {
		method: 'POST',
		body: JSON.stringify(body)
	});
};
