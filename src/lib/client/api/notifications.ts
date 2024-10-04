import { getApiAuthHeaders } from "../helpers/auth";

export const getNotifications = async (): Promise<Response> => {
	return await fetch('/api/notifications', {
		headers: getApiAuthHeaders(),
	});
};
