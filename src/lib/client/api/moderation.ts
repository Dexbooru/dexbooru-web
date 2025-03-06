import { getApiAuthHeaders } from '../helpers/auth';

export const getModerators = async () => {
	return await fetch('/api/moderators', {
		method: 'GET',
		headers: getApiAuthHeaders(),
	});
};
