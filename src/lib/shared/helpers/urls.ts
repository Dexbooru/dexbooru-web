import type { TUrlSearchParams } from '../types/urls';

export function buildUrl(baseUrl: string, params: TUrlSearchParams): URL {
	const resultantUrl = new URL(baseUrl);

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (Array.isArray(value)) {
				value.forEach((item) => resultantUrl.searchParams.append(key, item));
			} else {
				resultantUrl.searchParams.append(key, value);
			}
		}
	}

	return resultantUrl;
}
