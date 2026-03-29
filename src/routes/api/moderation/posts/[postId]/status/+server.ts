import { handleUpdatePostModerationStatus } from '$lib/server/controllers/moderation';
import type { RequestHandler } from '@sveltejs/kit';

export const PATCH: RequestHandler = async (event) => {
	return (await handleUpdatePostModerationStatus(event)) as ReturnType<RequestHandler>;
};
