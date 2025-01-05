import { SESSION_ID_KEY } from '$lib/shared/constants/session';

export const getApiAuthHeaders = (): HeadersInit => {
	const token = localStorage.getItem(SESSION_ID_KEY);
	if (!token) return {};

	return {
		Authorization: `Bearer ${token}`,
	};
};
