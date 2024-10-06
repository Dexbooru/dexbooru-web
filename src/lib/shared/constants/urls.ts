import { dev } from "$app/environment";

export const buildValidUrl = (url: string): string => {	
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url;
	}

	const finalProtocol = dev ? 'http' : 'https';
	return `${finalProtocol}://${url}`;
}


export const APP_BASE_URL = buildValidUrl(import.meta.env.VITE_APP_URL ?? '');