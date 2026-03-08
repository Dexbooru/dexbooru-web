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
