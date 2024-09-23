import { getNotifications } from '$lib/server/controllers/notifications';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return await getNotifications(request) as ReturnType<RequestHandler>;
}