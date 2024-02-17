import { deleteBatchFromBucket } from '$lib/server/aws/actions/s3';
import { AWS_POST_PICTURE_BUCKET_NAME } from '$lib/server/constants/aws';
import { deletePostById } from '$lib/server/db/actions/post';
import type { IDeletePostBody } from '$lib/shared/types/posts';
import { error, type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to delete posts, without being a signed in user!'
		});
	}

	const { postId, authorId }: IDeletePostBody = await request.json();
	if (!postId || !authorId) {
		throw error(400, {
			message: 'At least one of the required fields in the body was missing for deleting a post!'
		});
	}

	if (locals.user.id !== authorId) {
		throw error(401, {
			message: 'You are not authorized to delete this post, as you are not the author'
		});
	}

	const deletedPost = await deletePostById(postId, locals.user.id);
	if (!deletedPost) {
		throw error(404, {
			message: `A post with id: ${postId} does not exist or the user id: ${locals.user.id} is not the original author of the post!`
		});
	}

	await deleteBatchFromBucket(
		AWS_POST_PICTURE_BUCKET_NAME,
		deletedPost ? deletedPost.imageUrls : []
	);

	return new Response(
		JSON.stringify({
			message: `A post with the id: ${postId} and its corresponding comments and images were deleted successfully!`
		})
	);
};
