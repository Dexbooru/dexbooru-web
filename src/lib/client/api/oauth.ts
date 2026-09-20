export const processOauthToken = async (token: string) => {
	return await fetch('/oauth/callback', {
		method: 'POST',
		body: JSON.stringify({ token }),
	});
};

export const getOauthAuthorizationUrls = async (redirectTo?: string) => {
	const params = new URLSearchParams();
	if (redirectTo) params.set('redirectTo', redirectTo);
	const query = params.toString();
	return await fetch(`/api/oauth/authorization-urls${query ? `?${query}` : ''}`);
};
