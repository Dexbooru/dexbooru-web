import { POST_LIKE_ACTIONS } from '$lib/server/constants/posts';
import { findPostById, likePostById } from '$lib/server/db/actions/post';
import type { ILikePostBody } from '$lib/shared/types/posts';
import { error, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to like and dislike posts, without being a signed in user!'
		});
	}

	const { postId, action }: ILikePostBody = await request.json();
	if (!postId) {
		throw error(400, {
			message: 'The post id provided was invalid!'
		});
	}

	if (!action || !POST_LIKE_ACTIONS.includes(action)) {
		throw error(400, {
			message: `The action was invalid. It must be one of ${POST_LIKE_ACTIONS.join(', ')}`
		});
	}

	const post = await findPostById(postId, { likes: true });
	if (!post) {
		throw error(400, {
			message: 'A post with this id does not exist!'
		});
	}

	const { likes } = post;
	if (likes - 1 < 0 && action === 'dislike') {
		throw error(400, {
			message: 'The likes cannot be negative, so this dislike will be rejected!'
		});
	}

	const likedPost = await likePostById(postId, action, locals.user.id);
	if (!likedPost) {
		throw error(400, {
			message: 'An error occured while trying to like/dislike the post'
		});
	}

	return new Response(
		JSON.stringify({
			message: `The post with id ${postId} completed the action: ${action} successfully`
		})
	);
};
