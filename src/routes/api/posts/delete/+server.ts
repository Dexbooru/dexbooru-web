import { deleteBatchFromBucket } from '$lib/server/aws/actions/s3';
import type { IDeletePostBody } from '$lib/shared/types/posts';
import { deletePostById, findPostById } from '$lib/server/db/actions/post';
import { error, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to delete posts, without being a signed in user!'
		});
	}

	const { postId }: IDeletePostBody = await request.json();
	if (!postId) {
		throw error(400, {
			message: 'At least one of the required fields in the body was missing for deleting a post!'
		});
	}

	const currentPost = await findPostById(postId, { imageUrls: true });

	const deletedPost = await deletePostById(postId, locals.user.id);
	if (!deletedPost) {
		throw error(404, {
			message: `A post with id: ${postId} does not exist or the user id: ${locals.user.id} is not the original author of the post!`
		});
	}

	await deleteBatchFromBucket(
		process.env.AWS_POST_PICTURE_BUCKET || '',
		currentPost ? currentPost.imageUrls : []
	);

	return new Response(
		JSON.stringify({
			message: `A post with the id: ${postId} and its corresponding comments and images were deleted successfully!`
		})
	);
};
