import type { TUserNotifications } from '$lib/shared/types/notifcations';

export const getUserNotificationsFromId = async (_userId: string) => {
	const notificationData: TUserNotifications = {
		todo: 0,
	};

	return notificationData;
};
