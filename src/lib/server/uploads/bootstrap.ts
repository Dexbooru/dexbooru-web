import { RABBITMQ_CONNECT } from '../constants/rabbitmq';
import { setupUploadStatusRedisSubscription } from '../events/uploadStatus';
import logger from '../logging/logger';
import { startMediaUploadsConsumer } from '../rabbitmq/consumers/mediaUploads';

let hasBootstrappedUploadPipeline = false;

export const ensureUploadPipelineBootstrapped = async () => {
	if (hasBootstrappedUploadPipeline) return;
	hasBootstrappedUploadPipeline = true;

	await setupUploadStatusRedisSubscription();

	if (RABBITMQ_CONNECT) {
		startMediaUploadsConsumer();
		logger.info('Media upload pipeline consumer bootstrap requested');
	} else {
		logger.info('Skipping media upload pipeline consumer bootstrap (RabbitMQ disabled)');
	}
};
