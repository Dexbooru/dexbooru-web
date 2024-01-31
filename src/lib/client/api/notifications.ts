export const getNotifications = async (): Promise<Response> => {
	return await fetch('/api/auth/notifications');
};
