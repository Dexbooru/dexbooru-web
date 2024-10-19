import { PUBLIC_FRIEND_REQUEST_SELECTORS } from '$lib/server/constants/friends';
import type { IUserNotifications } from '$lib/shared/types/notifcations';
import { findFriendRequests } from './friends';

export const getUserNotificationsFromId = async (userId: string) => {
	const friendRequests = await findFriendRequests(userId, PUBLIC_FRIEND_REQUEST_SELECTORS);
	const notificationData: IUserNotifications = {
		friendRequests,
	};

	return notificationData;
};
