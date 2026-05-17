import {
	handleGetApplicationConfiguration,
	handleUpdateApplicationConfiguration,
} from '$lib/server/controllers/applicationConfiguration';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	return (await handleGetApplicationConfiguration(
		event,
		'api-route',
	)) as ReturnType<RequestHandler>;
};

export const PATCH: RequestHandler = async (event) => {
	return (await handleUpdateApplicationConfiguration(event)) as ReturnType<RequestHandler>;
};
