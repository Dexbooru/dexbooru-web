import { ConsumerStatus, type AsyncMessage } from 'rabbitmq-client';
import {
	deleteBatchFromBucket,
	deleteObjectsByKeys,
	deleteTempArtifactsByUploadId,
	downloadObjectBuffer,
} from '../../aws/actions/s3';
import { AWS_UPLOAD_ARTIFACTS_BUCKET_NAME } from '../../constants/aws';
import {
	MEDIA_UPLOADS_QUEUE,
	MEDIA_UPLOADS_ROUTING_KEY,
	UPLOAD_EVENTS_EXCHANGE,
} from '../../constants/rabbitmq';
import { USER_SAFE_UPLOAD_FAILURE_MESSAGE } from '../../constants/upload';
import {
	emitUploadCompleted,
	emitUploadFailure,
	emitUploadProgress,
} from '../../events/uploadStatus';
import logger from '../../logging/logger';
import type { TMediaUploadJob } from '../../types/upload';
import { getMediaUploadStrategy } from '../../uploads/strategies';
import { leaveUploadQueue } from '../../uploads/uploadQueueLedger';
import { imageTransformPool } from '../../workers/imageTransformPool';
import { BaseConsumer } from '../baseConsumer';

const isMediaUploadJob = (value: unknown): value is TMediaUploadJob => {
	if (!value || typeof value !== 'object') return false;
	const job = value as TMediaUploadJob;
	return (
		typeof job.uploadId === 'string' &&
		typeof job.resourceType === 'string' &&
		typeof job.isNsfw === 'boolean' &&
		Array.isArray(job.images)
	);
};

export class MediaUploadsConsumer extends BaseConsumer {
	constructor() {
		super({
			exchange: UPLOAD_EVENTS_EXCHANGE,
			routingKey: MEDIA_UPLOADS_ROUTING_KEY,
			queue: MEDIA_UPLOADS_QUEUE,
			prefetchCount: 1,
			concurrency: 1,
			requeue: false,
		});
	}

	protected async handleMessage(msg: AsyncMessage): Promise<ConsumerStatus | void> {
		const body = msg.body;
		let job: unknown = body;
		if (Buffer.isBuffer(body)) {
			job = JSON.parse(body.toString('utf8'));
		} else if (typeof body === 'string') {
			job = JSON.parse(body);
		}

		if (!isMediaUploadJob(job)) {
			logger.error('Invalid media upload job payload', { body });
			return ConsumerStatus.DROP;
		}

		const strategy = getMediaUploadStrategy(job.resourceType);
		if (!strategy) {
			logger.error('Unknown media upload resource type', {
				uploadId: job.uploadId,
				resourceType: job.resourceType,
			});
			await emitUploadFailure(job.uploadId, USER_SAFE_UPLOAD_FAILURE_MESSAGE, 'UNKNOWN_RESOURCE');
			return ConsumerStatus.DROP;
		}

		const { uploadId, isNsfw, images, resourceType } = job;
		let finalImageUrls: string[] = [];
		let finalObjectKeys: string[] = [];

		try {
			logger.info('Media upload job received', {
				uploadId,
				resourceType,
				imageCount: images.length,
				isNsfw,
			});

			await leaveUploadQueue(uploadId);

			if (strategy.emitProgress) {
				await emitUploadProgress(uploadId, 'Processing images...');
			}

			const transformed = [];
			const rawHashes: string[] = [];

			for (const image of images.sort((a, b) => a.index - b.index)) {
				logger.info('Downloading temp upload artifact', {
					uploadId,
					resourceType,
					index: image.index,
					tempObjectKey: image.tempObjectKey,
				});
				const rawBuffer = await downloadObjectBuffer(
					AWS_UPLOAD_ARTIFACTS_BUCKET_NAME,
					image.tempObjectKey,
				);
				rawHashes.push(image.sha256);

				logger.info('Transforming image in worker thread', {
					uploadId,
					resourceType,
					preset: strategy.transformPreset,
					index: image.index,
				});
				const imageData = await imageTransformPool.transform(
					rawBuffer,
					isNsfw,
					strategy.transformPreset,
				);
				transformed.push(imageData);
			}

			if (strategy.emitProgress) {
				await emitUploadProgress(uploadId, 'Uploading images to server...');
			}

			const uploaded = await strategy.uploadFinals(transformed);
			finalImageUrls = uploaded.imageUrls;
			finalObjectKeys = uploaded.finalObjectKeys;

			await emitUploadCompleted(
				uploadId,
				strategy.toCompletionResult({
					imageUrls: uploaded.imageUrls,
					imageWidths: uploaded.imageWidths,
					imageHeights: uploaded.imageHeights,
					imageHashes: rawHashes,
				}),
			);

			logger.info('Media upload job completed', {
				uploadId,
				resourceType,
				finalUrlCount: finalImageUrls.length,
			});
			return ConsumerStatus.ACK;
		} catch (error) {
			logger.error('Media upload job failed', {
				uploadId,
				resourceType,
				stage: 'consume',
				error,
			});

			if (finalImageUrls.length > 0) {
				try {
					await deleteBatchFromBucket(strategy.destinationBucket, finalImageUrls);
				} catch (cleanupError) {
					logger.error('Failed to rollback final media images after job failure', {
						uploadId,
						resourceType,
						error: cleanupError,
					});
				}
			} else if (finalObjectKeys.length > 0) {
				try {
					await deleteObjectsByKeys(strategy.destinationBucket, finalObjectKeys);
				} catch (cleanupError) {
					logger.error('Failed to rollback final object keys after job failure', {
						uploadId,
						resourceType,
						error: cleanupError,
					});
				}
			}

			await deleteTempArtifactsByUploadId(resourceType, uploadId);
			await emitUploadFailure(uploadId, USER_SAFE_UPLOAD_FAILURE_MESSAGE, 'TRANSFORM_FAILED');
			return ConsumerStatus.DROP;
		}
	}
}

let mediaUploadsConsumer: MediaUploadsConsumer | null = null;

export const startMediaUploadsConsumer = () => {
	if (mediaUploadsConsumer) return;
	mediaUploadsConsumer = new MediaUploadsConsumer();
	mediaUploadsConsumer.start();
};

export const stopMediaUploadsConsumer = async () => {
	if (!mediaUploadsConsumer) return;
	await mediaUploadsConsumer.close();
	mediaUploadsConsumer = null;
};
