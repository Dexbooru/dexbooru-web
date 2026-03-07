import type { TUserNotifications } from '$lib/shared/types/notifcations';

export const getUserNotificationsFromId = async (_userId: string): Promise<TUserNotifications> => {
	return {
		newPostLikes: [],
		newPostComments: [],
		newFriendInvites: [],
	};
};
