import { describe, it, expect } from 'vitest';
import { redactForLog } from '$lib/server/logging/redactForLog';

describe('redactForLog', () => {
	it.each([
		{
			name: 'password fields',
			input: {
				username: 'alice',
				password: 'super-secret',
				confirmedPassword: 'super-secret',
			},
			forbidden: ['super-secret'],
		},
		{
			name: 'case-insensitive Email',
			input: { Username: 'a', EMail: 'alice@example.com' },
			forbidden: ['alice@example.com', '@example'],
		},
		{
			name: 'otp and tokens',
			input: {
				otpCode: '123456',
				token: 'bearer-xx',
				tokenId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			},
			forbidden: ['123456', 'bearer-xx', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
		},
		{
			name: 'nested object',
			input: {
				user: { email: 'nested@test.com', name: 'visible' },
				password: 'UniquePasswordToken999',
			},
			forbidden: ['nested@test.com', 'UniquePasswordToken999'],
		},
	])('redacts $name', ({ input, forbidden }) => {
		const out = redactForLog(input) as Record<string, unknown>;
		const json = JSON.stringify(out);
		for (const secret of forbidden) {
			expect(json).not.toContain(secret);
		}
		expect(json).toContain('[REDACTED]');
	});

	it('preserves non-sensitive fields', () => {
		const out = redactForLog({ username: 'bob', rememberMe: 'on' }) as Record<string, unknown>;
		expect(out.username).toBe('bob');
		expect(out.rememberMe).toBe('on');
	});

	it('leaves scalars unchanged', () => {
		expect(redactForLog('plain')).toBe('plain');
		expect(redactForLog(null)).toBe(null);
		expect(redactForLog(42)).toBe(42);
	});
});
