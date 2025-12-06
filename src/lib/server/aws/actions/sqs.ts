import { AWS_SQS_POST_CLASSIFICATION_QUEUE_URL } from '$env/static/private';
import type { Post } from '$generated/prisma/client';
import type { TPostImageSqsMessage } from '$lib/server/types/aws';
import { ORIGINAL_IMAGE_SUFFIX } from '$lib/shared/constants/images';
import { SendMessageCommand, type SendMessageCommandInput } from '@aws-sdk/client-sqs';
import sqsClient from '../sqs';

export const enqueueUploadedPostImage = async (
	postImageInput: TPostImageSqsMessage,
): Promise<boolean> => {
	const rawMessageStream = JSON.stringify(postImageInput);
	const params: SendMessageCommandInput = {
		MessageBody: rawMessageStream,
		QueueUrl: AWS_SQS_POST_CLASSIFICATION_QUEUE_URL,
	};
	const response = await sqsClient.send(new SendMessageCommand(params));
	return response.$metadata.httpStatusCode === 200;
};

export const enqueueBatchUploadedPostImages = async (post: Post): Promise<boolean> => {
	const postImageUrls = post.imageUrls;
	const originalSizedImageUrls = postImageUrls.filter((imageUrl) =>
		imageUrl.endsWith(ORIGINAL_IMAGE_SUFFIX),
	);

	const postImageInputs: TPostImageSqsMessage[] = originalSizedImageUrls.map((imageUrl) => ({
		postId: post.id,
		imageUrl,
	}));

	await Promise.allSettled(
		postImageInputs.map(async (postImageInput) => {
			return enqueueUploadedPostImage(postImageInput);
		}),
	);

	return true;
};
