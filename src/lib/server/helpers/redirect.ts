/**
 * Returns a safe redirect path: relative path starting with `/` but not `//`.
 * Use to avoid open redirects when using user-provided redirectTo.
 */
export function getSafeRedirectTo(value: string | undefined, defaultPath: string): string {
	if (value == null || typeof value !== 'string') return defaultPath;
	const trimmed = value.trim();
	if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
	return defaultPath;
}

const MOBILE_APP_SCHEME = 'dexboorumobile';

function isLocalHostname(hostname: string): boolean {
	const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
	if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
	if (/^10(?:\.\d{1,3}){3}$/.test(host)) return true;
	if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
	if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
	return false;
}

/**
 * Allows only the Dexbooru app scheme, Expo Go, or local Expo web origins.
 */
export function getSafeNativeReturnUrl(value: string | undefined): string | undefined {
	if (value == null || typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;

	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		return undefined;
	}

	const scheme = parsed.protocol.replace(/:$/, '').toLowerCase();
	const isAppScheme = scheme === MOBILE_APP_SCHEME || scheme === 'exp' || scheme.startsWith('exp+');
	const isLocalWeb = (scheme === 'http' || scheme === 'https') && isLocalHostname(parsed.hostname);
	if (!isAppScheme && !isLocalWeb) return undefined;

	parsed.search = '';
	parsed.hash = '';
	return parsed.toString().replace(/\/$/, '');
}
