import { getApiAuthHeaders } from '../helpers/auth';

export const validateUserAuthToken = async () => {
	return await fetch('/api/users/oauth2', {
		headers: getApiAuthHeaders(),
	});
};

export const generateUserTotp = async (password: string) => {
	return await fetch('/api/users/totp', {
		method: 'POST',
		body: JSON.stringify({ password }),
		headers: getApiAuthHeaders(),
	});
};
