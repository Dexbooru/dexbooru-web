import { dev } from '$app/environment';

export const buildValidUrl = (url: string): string => {
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url;
	}

	const finalProtocol = dev ? 'http' : 'https';
	return `${finalProtocol}://${url}`;
};
