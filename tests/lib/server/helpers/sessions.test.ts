import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import {
	SESSION_JWT_EXPIRES_IN_STANDARD_AGE,
	SESSION_JWT_EXPIRES_IN_SUPER_AGE,
} from '$lib/server/constants/cookies';

vi.mock('$lib/server/runtimeEnv', () => ({
	JWT_PRIVATE_KEY: 'test-jwt-private-key-for-unit-tests',
	APP_URL: 'https://test.example.com',
	DOMAIN: 'test.example.com',
}));

vi.unmock('$lib/server/helpers/sessions');

import {
	generateEncodedUserTokenFromRecord,
	getUserClaimsFromEncodedJWTToken,
} from '$lib/server/helpers/sessions';

describe('sessions JWT helpers', () => {
	const userRecord = { id: 'user-123', username: 'alice' };

	it('round-trips user claims through encode and decode', () => {
		const token = generateEncodedUserTokenFromRecord(userRecord, false, 3600);
		const claims = getUserClaimsFromEncodedJWTToken(token);

		expect(claims).toMatchObject({ id: 'user-123' });
	});

	it('returns null for invalid token', () => {
		expect(getUserClaimsFromEncodedJWTToken('not-a-valid-jwt')).toBeNull();
	});

	it('uses standard expiry when rememberMe is false', () => {
		const token = generateEncodedUserTokenFromRecord(userRecord, false);
		const decoded = jwt.decode(token) as jwt.JwtPayload;

		expect(decoded.exp! - decoded.iat!).toBe(SESSION_JWT_EXPIRES_IN_STANDARD_AGE);
	});

	it('uses super expiry when rememberMe is true', () => {
		const token = generateEncodedUserTokenFromRecord(userRecord, true);
		const decoded = jwt.decode(token) as jwt.JwtPayload;

		expect(decoded.exp! - decoded.iat!).toBe(SESSION_JWT_EXPIRES_IN_SUPER_AGE);
	});
});
