import {
	handleGetOwnerResourceModerationStatus,
	handleOwnerAmendResourceModerationStatus,
} from '$lib/server/controllers/moderation';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	return (await handleGetOwnerResourceModerationStatus(event)) as ReturnType<RequestHandler>;
};

export const PATCH: RequestHandler = async (event) => {
	return (await handleOwnerAmendResourceModerationStatus(event)) as ReturnType<RequestHandler>;
};
