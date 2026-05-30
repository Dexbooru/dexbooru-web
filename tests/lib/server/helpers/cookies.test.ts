import { describe, expect, it, vi } from 'vitest';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY } from '$lib/server/constants/notifications';
import {
	SESSION_ID_COOKIE_STANDARD_AGE,
	SESSION_ID_COOKIE_SUPER_AGE,
} from '$lib/server/constants/cookies';

vi.unmock('$lib/server/helpers/cookies');

import {
	buildCookieOptions,
	clearNotificationSessionCookie,
	clearSessionIdCookie,
} from '$lib/server/helpers/cookies';

describe('buildCookieOptions', () => {
	it('uses standard maxAge when rememberMe is false', () => {
		expect(buildCookieOptions(false).maxAge).toBe(SESSION_ID_COOKIE_STANDARD_AGE);
	});

	it('uses super maxAge when rememberMe is true', () => {
		expect(buildCookieOptions(true).maxAge).toBe(SESSION_ID_COOKIE_SUPER_AGE);
	});

	it('sets path to /', () => {
		expect(buildCookieOptions(false).path).toBe('/');
	});
});

describe('clearSessionIdCookie', () => {
	it('expires session cookie via cookies.set', () => {
		const set = vi.fn();
		const cookies = { set } as unknown as import('@sveltejs/kit').Cookies;

		clearSessionIdCookie(cookies);

		expect(set).toHaveBeenCalledWith(
			SESSION_ID_KEY,
			'',
			expect.objectContaining({ path: '/', maxAge: 0 }),
		);
	});
});

describe('clearNotificationSessionCookie', () => {
	it('expires notifications cookie via cookies.set', () => {
		const set = vi.fn();
		const cookies = { set } as unknown as import('@sveltejs/kit').Cookies;

		clearNotificationSessionCookie(cookies);

		expect(set).toHaveBeenCalledWith(
			DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY,
			'',
			expect.objectContaining({ path: '/', maxAge: 0 }),
		);
	});
});
