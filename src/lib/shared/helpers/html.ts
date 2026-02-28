/**
 * Escapes HTML special characters to prevent XSS when interpolating user-controlled
 * values into HTML content. Replaces & < > " ' with their HTML entities.
 */
export function escapeHtml(unsafe: string): string {
	return unsafe
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
