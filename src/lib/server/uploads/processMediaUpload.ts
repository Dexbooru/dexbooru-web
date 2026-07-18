import {
	buildTempUploadObjectKey,
	deleteTempArtifactsByUploadId,
	uploadRawToArtifactsBucket,
} from '../aws/actions/s3';
import { USER_SAFE_UPLOAD_FAILURE_MESSAGE } from '../constants/upload';
import {
	emitUploadFailure,
	emitUploadProgress,
	waitForUploadCompletion,
} from '../events/uploadStatus';
import { hashFile } from '../helpers/images';
import logger from '../logging/logger';
import mediaUploadsPublisher, { MediaUploadsPublisher } from '../rabbitmq/publishers/mediaUploads';
import type {
	TMediaUploadJob,
	TMediaUploadResourceType,
	TMediaUploadResult,
} from '../types/upload';
import { getMediaUploadStrategy } from './strategies';
import { enqueueUploadQueue, leaveUploadQueue } from './uploadQueueLedger';

export type TProcessMediaUploadInput = {
	resourceType: TMediaUploadResourceType;
	files: File[];
	isNsfw?: boolean;
	uploadId?: string;
	/** When true (posts), emit SSE-facing progress + queue position messages. */
	emitProgress?: boolean;
};

const stageRawMediaImages = async (
	resourceType: TMediaUploadResourceType,
	files: File[],
	uploadId: string,
): Promise<TMediaUploadJob['images']> => {
	const images: TMediaUploadJob['images'] = [];

	for (let index = 0; index < files.length; index++) {
		const file = files[index];
		if (!file) {
			throw new Error(`Missing upload file at index ${index}`);
		}
		const sha256 = await hashFile(file);
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const tempObjectKey = buildTempUploadObjectKey(resourceType, uploadId, index);
		const contentType = file.type || 'application/octet-stream';

		logger.info('Staging raw upload artifact to S3', {
			resourceType,
			uploadId,
			index,
			tempObjectKey,
			contentType,
			byteLength: buffer.byteLength,
		});

		await uploadRawToArtifactsBucket(tempObjectKey, buffer, contentType);
		images.push({
			index,
			tempObjectKey,
			contentType,
			sha256,
		});
	}

	return images;
};

export const processMediaUpload = async ({
	resourceType,
	files,
	isNsfw = false,
	uploadId,
	emitProgress,
}: TProcessMediaUploadInput): Promise<TMediaUploadResult> => {
	const strategy = getMediaUploadStrategy(resourceType);
	if (!strategy) {
		throw new Error(`Unsupported media upload resource type: ${resourceType}`);
	}

	const shouldEmitProgress = emitProgress ?? strategy.emitProgress;
	const effectiveUploadId = uploadId ?? crypto.randomUUID();

	try {
		if (shouldEmitProgress) {
			await emitUploadProgress(effectiveUploadId, 'Hashing original files...');
		}
		logger.info('Preparing media upload', {
			resourceType,
			uploadId: effectiveUploadId,
			count: files.length,
			isNsfw,
		});

		if (shouldEmitProgress) {
			await emitUploadProgress(effectiveUploadId, 'Uploading original images for processing...');
		}
		const images = await stageRawMediaImages(resourceType, files, effectiveUploadId);

		const job: TMediaUploadJob = {
			uploadId: effectiveUploadId,
			resourceType,
			isNsfw,
			images,
		};

		const completionPromise = waitForUploadCompletion(effectiveUploadId);

		let queued = false;
		try {
			await enqueueUploadQueue(effectiveUploadId, { emitProgress: shouldEmitProgress });
			queued = true;
		} catch (queueError) {
			logger.error('Failed to enqueue upload queue position ledger', {
				uploadId: effectiveUploadId,
				resourceType,
				error: queueError,
			});
		}

		logger.info('Publishing media upload job', {
			uploadId: effectiveUploadId,
			resourceType,
			imageCount: images.length,
			isNsfw,
		});
		try {
			await mediaUploadsPublisher.publish(MediaUploadsPublisher.ROUTING_KEY, job);
		} catch (publishError) {
			if (queued) {
				await leaveUploadQueue(effectiveUploadId);
			}
			throw publishError;
		}

		const result = await completionPromise;
		logger.info('Processed media upload ready', {
			uploadId: effectiveUploadId,
			resourceType,
			urls: result.imageUrls,
		});
		return result;
	} catch (error) {
		logger.error('processMediaUpload failed', {
			uploadId: effectiveUploadId,
			resourceType,
			stage: 'stage-or-wait',
			error,
		});
		await leaveUploadQueue(effectiveUploadId).catch((leaveError) => {
			logger.error('Failed to leave upload queue after error', {
				uploadId: effectiveUploadId,
				error: leaveError,
			});
		});
		const message =
			error instanceof Error && error.message ? error.message : USER_SAFE_UPLOAD_FAILURE_MESSAGE;
		if (shouldEmitProgress) {
			await emitUploadFailure(effectiveUploadId, message);
		} else {
			await emitUploadFailure(effectiveUploadId, message).catch(() => undefined);
		}
		throw error instanceof Error ? error : new Error(message);
	} finally {
		const deleted = await deleteTempArtifactsByUploadId(resourceType, effectiveUploadId);
		logger.info('Temp artifact cleanup finished', {
			uploadId: effectiveUploadId,
			resourceType,
			deleted,
		});
	}
};
