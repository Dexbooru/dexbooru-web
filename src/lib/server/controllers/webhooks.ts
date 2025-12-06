import { WEBHOOK_SECRET } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';
import { WEBHOOK_SECRET_REQUEST_HEADER } from '../constants/webhooks';
import { createPostSources } from '../db/actions/postSource';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import { PostClassificationResultsSchema } from './request-schemas/webhooks';

export const handlePostClassificationResultWebhook = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		PostClassificationResultsSchema,
		async (data) => {
			try {
				const headers = event.request.headers;
				const receivedWebhookApiKey = headers.get(WEBHOOK_SECRET_REQUEST_HEADER);

				if (!receivedWebhookApiKey) {
					return createErrorResponse('api-route', 400, 'Missing webhook API key header');
				}

				if (receivedWebhookApiKey !== WEBHOOK_SECRET) {
					return createErrorResponse('api-route', 401, 'Invalid webhook API key');
				}

				const { results } = data.body;

				logger.info(`Received ${results.length} post classification results via webhook.`);

				const batchResult = await createPostSources(results);
				const batchPostIds = [...new Set(results.map((result) => result.postId))];

				logger.info(
					`Successfully created ${batchResult.count} post sources from classification results.`,
				);

				return createSuccessResponse(
					'api-route',
					'Post classification results processed successfully',
					{ recordsAdded: batchResult.count, postIdsServed: batchPostIds },
					201,
				);
			} catch (error) {
				logger.error('Error handling post classification result webhook:', error);

				return createErrorResponse(
					'api-route',
					500,
					'Failed to process post classification result webhook',
				);
			}
		},
	);
};
