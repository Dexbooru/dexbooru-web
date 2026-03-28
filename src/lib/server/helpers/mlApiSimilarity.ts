/**
 * Parse FastAPI-style error bodies: `{ "detail": string | object[] }`.
 */
export async function parseDexbooruMlErrorMessage(response: Response): Promise<string> {
	let text = '';
	try {
		text = await response.text();
		const parsed = JSON.parse(text) as { detail?: unknown };
		if (typeof parsed.detail === 'string') {
			return parsed.detail;
		}
		if (Array.isArray(parsed.detail)) {
			const parts = parsed.detail.map((item: unknown) => {
				if (item && typeof item === 'object' && 'msg' in item) {
					return String((item as { msg: string }).msg);
				}
				return '';
			});
			const joined = parts.filter(Boolean).join('; ');
			if (joined) {
				return joined;
			}
		}
	} catch {
		if (text?.trim()) {
			const snippet = text.length > 200 ? `${text.slice(0, 200)}…` : text;
			return `${snippet} (HTTP ${response.status})`;
		}
	}
	return `Similarity search failed (HTTP ${response.status})`;
}
