import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_POST_SELECTORS, findPostById } from '$lib/db/actions/post';

export const load: PageServerLoad = async ({ params }) => {
	const postId = params.postId;
	if (!postId) {
		throw error(400, { message: `The post id is a required parameter!` });
	}

	const post = await findPostById(postId, PUBLIC_POST_SELECTORS);

	if (!post) {
		throw error(404, { message: `A post with the id: ${postId} does not exist!` });
	}

	return { post };
};
