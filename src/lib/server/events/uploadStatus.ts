import { EventEmitter } from 'events';
import {
	UPLOAD_COMPLETION_TIMEOUT_MS,
	UPLOAD_STATUS_REDIS_CHANNEL,
	USER_SAFE_UPLOAD_FAILURE_MESSAGE,
} from '../constants/upload';
import redis from '../db/redis';
import logger from '../logging/logger';
import type {
	TMediaUploadResult,
	TUploadCompletedEvent,
	TUploadFailedEvent,
	TUploadStatusEvent,
} from '../types/upload';

class UploadStatusEmitter extends EventEmitter {}

export const uploadStatusEmitter = new UploadStatusEmitter();

const LOCAL_EVENT = 'upload-status';

export const emitLocalUploadStatus = (event: TUploadStatusEvent) => {
	uploadStatusEmitter.emit(LOCAL_EVENT, event);
	uploadStatusEmitter.emit(event.uploadId, event);
};

const publishUploadStatus = async (event: TUploadStatusEvent) => {
	emitLocalUploadStatus(event);
	try {
		await redis.publish(UPLOAD_STATUS_REDIS_CHANNEL, JSON.stringify(event));
	} catch (error) {
		logger.error('Failed to publish upload status to Redis', {
			uploadId: event.uploadId,
			kind: event.kind,
			error,
		});
	}
};

export const emitUploadProgress = async (uploadId: string, message: string) => {
	logger.info('Upload progress', { uploadId, message });
	await publishUploadStatus({ uploadId, kind: 'progress', message });
};

export const emitUploadCompleted = async (
	uploadId: string,
	result: TMediaUploadResult,
	message: string = 'Images processed successfully',
) => {
	logger.info('Upload completed', { uploadId, imageUrlCount: result.imageUrls.length });
	await publishUploadStatus({
		uploadId,
		kind: 'completed',
		message,
		result,
	} satisfies TUploadCompletedEvent);
};

export const emitUploadFailure = async (
	uploadId: string,
	message: string = USER_SAFE_UPLOAD_FAILURE_MESSAGE,
	errorCode?: string,
) => {
	logger.error('Upload failed', { uploadId, message, errorCode });
	await publishUploadStatus({
		uploadId,
		kind: 'failed',
		message,
		errorCode,
	} satisfies TUploadFailedEvent);
};

export const waitForUploadCompletion = (
	uploadId: string,
	timeoutMs: number = UPLOAD_COMPLETION_TIMEOUT_MS,
): Promise<TMediaUploadResult> => {
	return new Promise((resolve, reject) => {
		const onEvent = (event: TUploadStatusEvent) => {
			if (event.uploadId !== uploadId) return;

			if (event.kind === 'completed') {
				cleanup();
				resolve(event.result);
				return;
			}

			if (event.kind === 'failed') {
				cleanup();
				reject(new Error(event.message || USER_SAFE_UPLOAD_FAILURE_MESSAGE));
			}
		};

		const timeout = setTimeout(() => {
			cleanup();
			reject(new Error('Image processing timed out. Please try again.'));
		}, timeoutMs);

		const cleanup = () => {
			clearTimeout(timeout);
			uploadStatusEmitter.off(uploadId, onEvent);
		};

		uploadStatusEmitter.on(uploadId, onEvent);
	});
};

let hasConfiguredUploadStatusSubscription = false;
let uploadStatusSubscriber: typeof redis | null = null;

export const setupUploadStatusRedisSubscription = async () => {
	if (hasConfiguredUploadStatusSubscription) return;

	try {
		uploadStatusSubscriber = uploadStatusSubscriber ?? redis.duplicate();
		if (!uploadStatusSubscriber.isOpen) {
			await uploadStatusSubscriber.connect();
		}
		await uploadStatusSubscriber.subscribe(UPLOAD_STATUS_REDIS_CHANNEL, (message) => {
			try {
				const payload = JSON.parse(message) as TUploadStatusEvent;
				emitLocalUploadStatus(payload);
			} catch (error) {
				logger.error('Failed to parse upload status pub/sub payload', { error });
			}
		});
		hasConfiguredUploadStatusSubscription = true;
		logger.info('Subscribed to upload status Redis channel');
	} catch (error) {
		logger.error('Failed to subscribe to upload status updates', { error });
	}
};
