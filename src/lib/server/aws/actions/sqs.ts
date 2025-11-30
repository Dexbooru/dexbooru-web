import { AWS_SQS_QUEUE_POST_CLASSIFICATION_NAME } from '$lib/server/constants/aws';
import type { TPostImageSqsMessage } from '$lib/server/types/aws';
import { GetQueueUrlCommand, SendMessageCommand, type SendMessageCommandInput } from '@aws-sdk/client-sqs';
import sqsClient from '../sqs';

const queueNameToUrlMap: Map<string, string> = new Map();

export const getQueueUrl = async (queueName: string): Promise<string | null> => {
    if (queueName.length === 0) return null;
    if (queueNameToUrlMap.has(queueName)) {
        return queueNameToUrlMap.get(queueName) || null;
    }

    const response = await sqsClient.send(new GetQueueUrlCommand({ QueueName: queueName }));
    if (response.$metadata.httpStatusCode !== 200 || !response.QueueUrl) {
        return null;
    }

    queueNameToUrlMap.set(queueName, response.QueueUrl);
    return response.QueueUrl;
};

export const enqueueUploadedPostImage = async (postImageInput: TPostImageSqsMessage): Promise<boolean> => {
    const rawMessageStream = JSON.stringify(postImageInput);
    const queueUrl = await getQueueUrl(AWS_SQS_QUEUE_POST_CLASSIFICATION_NAME);

    if (!queueUrl) {
        return false;
    }

    const params: SendMessageCommandInput = {
        MessageBody: rawMessageStream,
        QueueUrl: queueUrl,
    };
    const response = await sqsClient.send(new SendMessageCommand(params));

    console.log(`Response after enqueueing post image for classification: ${JSON.stringify(response)} for postImageInput: ${rawMessageStream}`);
    return response.$metadata.httpStatusCode === 200;
}

export const enqueueBatchUploadedPostImages = async (postImageInputs: TPostImageSqsMessage[]): Promise<boolean> => {
    await Promise.allSettled(
        postImageInputs.map(async (postImageInput) => {
            return enqueueUploadedPostImage(postImageInput);
        }
    )
    );
    
    return true;
}
