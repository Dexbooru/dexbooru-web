import { dev } from '$app/environment';

export const URL_REGEX =
	/^(https?:\/\/)(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(:[0-9]{1,5})?(\/[^\s?#]*)?(\?[^\s#]*)?(#[^\s]*)?$/;

export const buildValidUrl = (url: string): string => {
	if (url.startsWith('http://') || url.startsWith('https://')) {
		return url;
	}

	const finalProtocol = dev ? 'http' : 'https';
	return `${finalProtocol}://${url}`;
};
