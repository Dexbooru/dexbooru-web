import { DEXBOORU_NOTIFICATIONS_API_API_URL } from '../constants/notificationApi';

export const authenticateNotificationSession = async () => {
	const url = `${DEXBOORU_NOTIFICATIONS_API_API_URL}/api/auth`;

	const response = await fetch(url, {
		method: 'POST',
		credentials: 'include',
	});

	return response;
};
