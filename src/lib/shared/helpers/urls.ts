export const getPathFromUrl = (url: string, trimTrailingSlash: boolean = false): string => {
	const convertedUrl = new URL(url);
	const pathname = convertedUrl.pathname;

	if (trimTrailingSlash) {
		if (pathname === '/') {
			return pathname;
		}

		if (pathname.endsWith('/')) {
			return pathname.slice(0, -1);
		}

		return pathname;
	}
	return pathname;
};

export function getUrlFields<T>(searchParams: URLSearchParams, getAllFields: (keyof T)[] = []): T {
	const fields = {} as Record<keyof T, T[keyof T] | T[keyof T][]>;

	for (const [key, value] of searchParams.entries()) {
		if (getAllFields.includes(key as keyof T)) {
			if (!fields[key as keyof T]) {
				fields[key as keyof T] = [] as T[keyof T][];
			}

			if (Array.isArray(fields[key as keyof T])) {
				(fields[key as keyof T] as T[keyof T][]).push(value as T[keyof T]);
			}
		} else {
			fields[key as keyof T] = value as T[keyof T];
		}
	}

	return fields as T;
}
