import { PROTECTED_API_ENDPOINT_ROUTE_PREFIX, PROTECTED_FORM_ROUTES } from '../constants/auth';
import type { TSetHeadersFunction } from '../types/sessions';

export function cacheResponse(setHeaders: TSetHeadersFunction, cacheTimeInSeconds: number): void {
	setHeaders({
		'cache-control': `max-age=${cacheTimeInSeconds}`
	});
}

export const isProtectedRoute = (url: URL, requestMethod: string): boolean => {
	const currentRoute = url.pathname;
	const isProtectedApiEndpoint = currentRoute.startsWith(PROTECTED_API_ENDPOINT_ROUTE_PREFIX);
	const isProtectedFormEndpoint = !!PROTECTED_FORM_ROUTES.find((routeData) => {
		const { route, methods } = routeData;
		return currentRoute.startsWith(route) && methods.includes(requestMethod);
	});

	return isProtectedApiEndpoint || isProtectedFormEndpoint;
};
