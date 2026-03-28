import { parseDexbooruMlErrorMessage } from '$lib/server/helpers/mlApiSimilarity';
import { describe, expect, it } from 'vitest';

describe('parseDexbooruMlErrorMessage', () => {
	it('returns string detail from FastAPI JSON', async () => {
		const response = new Response(JSON.stringify({ detail: 'Invalid input' }), { status: 400 });
		expect(await parseDexbooruMlErrorMessage(response)).toBe('Invalid input');
	});

	it('joins validation error messages', async () => {
		const response = new Response(
			JSON.stringify({ detail: [{ msg: 'too short' }, { msg: 'bad format' }] }),
			{ status: 422 },
		);
		expect(await parseDexbooruMlErrorMessage(response)).toBe('too short; bad format');
	});

	it('falls back to status when body is not JSON', async () => {
		const response = new Response('not json', { status: 503 });
		expect(await parseDexbooruMlErrorMessage(response)).toBe('not json (HTTP 503)');
	});
});
