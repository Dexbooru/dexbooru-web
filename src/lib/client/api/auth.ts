export const generateUserTotp = async (password: string) => {
	return await fetch('/api/users/totp', {
		method: 'POST',
		body: JSON.stringify({ password }),
	});
};
