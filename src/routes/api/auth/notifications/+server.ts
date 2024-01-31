import { PUBLIC_FRIEND_REQUEST_SELECTORS } from '$lib/server/constants/friends';
import { findFriendRequests } from '$lib/server/db/actions/friends';
import type { IUserNotifications } from '$lib/shared/types/notifcations';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(400, {
			message: 'You are not authorized to get notifications without being a signed in user!'
		});
	}

	const friendRequests = await findFriendRequests(locals.user.id, PUBLIC_FRIEND_REQUEST_SELECTORS);

	const notificationData: IUserNotifications = {
		friendRequests
	};

	return new Response(JSON.stringify(notificationData));
};
