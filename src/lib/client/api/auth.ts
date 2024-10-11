import { getApiAuthHeaders } from '../helpers/auth';

export const validateUserAuthToken = async () => {
	return await fetch('/api/users/oauth2', {
		headers: getApiAuthHeaders(),
	});
};
