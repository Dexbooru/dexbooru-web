import type { TSetHeadersFunction } from '../types/sessions';

export function cacheResponse(setHeaders: TSetHeadersFunction, cacheTimeInSeconds: number): void {
	setHeaders({
		'cache-control': `max-age=${cacheTimeInSeconds}`
	});
}
