export const processOauthToken = async (token: string) => {
	return await fetch('/oauth/callback', {
		method: 'POST',
		body: JSON.stringify({ token }),
	});
};
