import { enrichNotifications } from '$lib/server/helpers/notifications/enrichNotifications';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import type { TRealtimeNotification } from '$lib/shared/types/notifcations';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (locals.user.id === NULLABLE_USER.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = (await request.json()) as { notifications: TRealtimeNotification[] };

	if (!body.notifications || !Array.isArray(body.notifications)) {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const enriched = await enrichNotifications(body.notifications);
	return json({ notifications: enriched });
};
