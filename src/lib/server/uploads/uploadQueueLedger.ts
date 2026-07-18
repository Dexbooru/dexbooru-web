import { UPLOAD_QUEUE_SEQ_KEY, UPLOAD_QUEUE_WAITING_KEY } from '../constants/upload';
import redis from '../db/redis';
import { emitUploadProgress } from '../events/uploadStatus';
import logger from '../logging/logger';

export const formatQueuePositionMessage = (position: number): string => {
	if (position <= 1) {
		return "Queued — you're next";
	}
	return `Queued — position ${position}`;
};

type TEnqueueUploadQueueOptions = {
	emitProgress?: boolean;
};

/**
 * Enqueue an upload job into the waiting ledger.
 * Score is a monotonic sequence so FIFO order matches RabbitMQ publish order.
 * Returns 1-based position among currently waiting jobs.
 */
export const enqueueUploadQueue = async (
	uploadId: string,
	options: TEnqueueUploadQueueOptions = {},
): Promise<number> => {
	const { emitProgress = true } = options;
	const seq = await redis.incr(UPLOAD_QUEUE_SEQ_KEY);
	await redis.zAdd(UPLOAD_QUEUE_WAITING_KEY, { score: seq, value: uploadId });
	const rank = await redis.zRank(UPLOAD_QUEUE_WAITING_KEY, uploadId);
	const position = (rank ?? 0) + 1;

	logger.info('Enqueued upload in waiting ledger', { uploadId, seq, position, emitProgress });
	if (emitProgress) {
		await emitUploadProgress(uploadId, formatQueuePositionMessage(position));
	}
	return position;
};

/**
 * Remove an upload from the waiting ledger and notify remaining waiters of new ranks.
 * No-op (and no fan-out) if the upload was not waiting.
 */
export const leaveUploadQueue = async (uploadId: string): Promise<boolean> => {
	const removed = await redis.zRem(UPLOAD_QUEUE_WAITING_KEY, uploadId);
	if (!removed) {
		return false;
	}

	logger.info('Removed upload from waiting ledger', { uploadId });
	await notifyWaitingUploadPositions();
	return true;
};

/**
 * Fan out current 1-based positions to every waiting uploadId (ordered by score).
 * Uses a single ZRANGE then parallel progress emits.
 */
export const notifyWaitingUploadPositions = async (): Promise<number> => {
	const uploadIds = await redis.zRange(UPLOAD_QUEUE_WAITING_KEY, 0, -1);
	if (uploadIds.length === 0) {
		return 0;
	}

	await Promise.all(
		uploadIds.map((waitingUploadId, index) =>
			emitUploadProgress(waitingUploadId, formatQueuePositionMessage(index + 1)),
		),
	);

	logger.info('Notified waiting upload queue positions', { waitingCount: uploadIds.length });
	return uploadIds.length;
};

/** Test/helper: current waiting depth. */
export const getUploadQueueDepth = async (): Promise<number> => {
	return await redis.zCard(UPLOAD_QUEUE_WAITING_KEY);
};
