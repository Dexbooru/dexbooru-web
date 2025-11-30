import type { RequestEvent } from '@sveltejs/kit';
import { createPostSources } from '../db/actions/postSource';
import { createErrorResponse, validateAndHandleRequest } from '../helpers/controllers';
import logger from '../logging/logger';
import { PostClassificationResultsSchema } from './request-schemas/webhooks';


export const handlePostClassificationResultWebhook = async (event: RequestEvent) => {
    return await validateAndHandleRequest(event, 'api-route', PostClassificationResultsSchema, async data => {
        try {
            const { results } = data.body;

            logger.info(`Received ${results.length} post classification results via webhook.`);

            const batchResult = await createPostSources(results);

            logger.info(`Successfully created ${batchResult.count} post sources from classification results.`);

        } catch (error) {
            logger.error('Error handling post classification result webhook:', error);

            return createErrorResponse('api-route', 500, 'Failed to process post classification result webhook');
        }

    });
}