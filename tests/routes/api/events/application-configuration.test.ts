import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDefaultApplicationConfiguration } from '$lib/shared/applicationConfiguration';

const listeners = new Map<string, ((payload: unknown) => void)[]>();

vi.mock('$lib/server/applicationConfiguration', () => ({
	getApplicationConfiguration: vi.fn(async () => buildDefaultApplicationConfiguration()),
}));

vi.mock('$lib/server/events/applicationConfiguration', () => ({
	applicationConfigurationEmitter: {
		on: vi.fn((event: string, callback: (payload: unknown) => void) => {
			const currentListeners = listeners.get(event) ?? [];
			currentListeners.push(callback);
			listeners.set(event, currentListeners);
		}),
		off: vi.fn((event: string, callback: (payload: unknown) => void) => {
			const currentListeners = listeners.get(event) ?? [];
			listeners.set(
				event,
				currentListeners.filter((listener) => listener !== callback),
			);
		}),
	},
}));

describe('application configuration SSE route', () => {
	beforeEach(() => {
		listeners.clear();
	});

	it('returns SSE response with initial payload', async () => {
		const { GET } = await import(
			'../../../../src/routes/api/events/application-configuration/+server'
		);
		const response = await GET({} as never);

		expect(response.headers.get('Content-Type')).toBe('text/event-stream');
	});
});
