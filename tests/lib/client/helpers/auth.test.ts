import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { getApiAuthHeaders } from '$lib/client/helpers/auth';

function createLocalStorageStub() {
	const store = new Map<string, string>();
	return {
		getItem: vi.fn((key: string) => store.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store.set(key, value);
		}),
		removeItem: vi.fn((key: string) => {
			store.delete(key);
		}),
		clear: vi.fn(() => {
			store.clear();
		}),
	};
}

describe('getApiAuthHeaders', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', createLocalStorageStub());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns empty object when token is missing', () => {
		expect(getApiAuthHeaders()).toEqual({});
	});

	it('returns Bearer header when token is present', () => {
		localStorage.setItem(SESSION_ID_KEY, 'session-token-123');

		expect(getApiAuthHeaders()).toEqual({
			Authorization: 'Bearer session-token-123',
		});
	});

	it('returns empty object for empty string token', () => {
		localStorage.setItem(SESSION_ID_KEY, '');

		expect(getApiAuthHeaders()).toEqual({});
	});
});
