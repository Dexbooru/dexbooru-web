import { SINGLE_POST_CACHE_TIME_SECONDS } from '$lib/server/constants/sessions';
import { PUBLIC_POST_SELECTORS } from '$lib/server/constants/posts';
import { findPostByIdWithUpdatedViewCount } from '$lib/server/db/actions/post';
import { cacheResponse } from '$lib/server/helpers/sessions';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	const postId = params.postId;
	if (!postId) {
		throw error(400, { message: `The post id is a required parameter!` });
	}

	const post = await findPostByIdWithUpdatedViewCount(postId, PUBLIC_POST_SELECTORS);

	if (!post) {
		throw error(404, { message: `A post with the id: ${postId} does not exist!` });
	}

	cacheResponse(setHeaders, SINGLE_POST_CACHE_TIME_SECONDS);

	return { post };
};
