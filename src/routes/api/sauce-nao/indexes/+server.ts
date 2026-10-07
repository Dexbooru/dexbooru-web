import {
	handleGetSauceNaoIndexes,
	handleSetEnabledSauceNaoIndexes,
} from '$lib/server/controllers/sauceNao';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	return (await handleGetSauceNaoIndexes(event)) as ReturnType<RequestHandler>;
};

export const PUT: RequestHandler = async (event) => {
	return (await handleSetEnabledSauceNaoIndexes(event)) as ReturnType<RequestHandler>;
};
