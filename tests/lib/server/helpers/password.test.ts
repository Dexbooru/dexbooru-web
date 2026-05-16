import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('password helpers (actual implementation)', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('generateRandomPassword returns correct length and printable ASCII', async () => {
		const { generateRandomPassword } = await vi.importActual<
			typeof import('$lib/server/helpers/password')
		>('$lib/server/helpers/password');

		const pwd = generateRandomPassword(24);
		expect(pwd).toHaveLength(24);
		for (const ch of pwd) {
			const code = ch.charCodeAt(0);
			expect(code).toBeGreaterThanOrEqual(33);
			expect(code).toBeLessThanOrEqual(126);
		}
	});

	it('generateRandomPassword uses crypto.getRandomValues', async () => {
		const spy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr) => {
			const view = arr as Uint8Array;
			view.fill(0);
			return view;
		});
		const { generateRandomPassword } = await vi.importActual<
			typeof import('$lib/server/helpers/password')
		>('$lib/server/helpers/password');

		generateRandomPassword(8);

		expect(spy).toHaveBeenCalled();
	});
});
