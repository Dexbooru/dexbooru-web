import type { TUrlSearchParams } from "$lib/shared/types/urls";
import { APP_BASE_URL } from "../constants/urls";

export function buildUrl(relativeUrlPath: string, params: TUrlSearchParams = {}): URL {
	const resultantUrl = new URL(relativeUrlPath, APP_BASE_URL);

	if (Object.keys(params).length > 0) {
		for (const [key, value] of Object.entries(params)) {
			if (Array.isArray(value)) {
				value.forEach((item) => resultantUrl.searchParams.append(key, (item as string).toString()));
			} else {
				resultantUrl.searchParams.append(key, (value as string).toString());
			}
		}
	}

	return resultantUrl;
}