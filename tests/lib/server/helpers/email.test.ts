import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/static/private', () => ({
	APP_URL: 'https://test.example.com',
	SMTP_HOST: 'localhost',
	SMTP_PORT: '587',
	SMTP_USERNAME: 'user',
	SMTP_PASSWORD: 'pass',
}));

vi.unmock('$lib/server/helpers/email');

import {
	buildEmailVerificationTemplate,
	buildPasswordRecoveryEmailTemplate,
	buildOauthPasswordEmailTemplate,
} from '$lib/server/helpers/email';

describe('email template builders', () => {
	describe('buildEmailVerificationTemplate', () => {
		it('should escape HTML special characters in username', () => {
			const result = buildEmailVerificationTemplate('<script>alert(1)</script>', 'token-123');

			expect(result).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
			expect(result).not.toContain('<script>');
		});

		it('should include verification link with token', () => {
			const result = buildEmailVerificationTemplate('alice', 'token-abc');

			expect(result).toContain('https://test.example.com/verify-email/token-abc');
		});

		it('should escape ampersand and quotes in username', () => {
			const result = buildEmailVerificationTemplate('user"&<test>', 't1');

			expect(result).toContain('user&quot;&amp;&lt;test&gt;');
		});
	});

	describe('buildPasswordRecoveryEmailTemplate', () => {
		it('should escape HTML special characters in username', () => {
			const result = buildPasswordRecoveryEmailTemplate('<img src=x>', 'recovery-id');

			expect(result).toContain('&lt;img src=x&gt;');
			expect(result).not.toContain('<img');
		});

		it('should include account recovery link', () => {
			const result = buildPasswordRecoveryEmailTemplate('alice', 'recovery-123');

			expect(result).toContain('https://test.example.com/recover-account/recovery-123');
		});

		it('should escape single quote in username', () => {
			const result = buildPasswordRecoveryEmailTemplate("o'brien", 'r1');

			expect(result).toContain('o&#39;brien');
		});
	});

	describe('buildOauthPasswordEmailTemplate', () => {
		it('should escape HTML special characters in username and password', () => {
			const result = buildOauthPasswordEmailTemplate(
				'<script>',
				'pass"word',
				'google',
			);

			expect(result).toContain('&lt;script&gt;');
			expect(result).toContain('pass&quot;word');
		});

		it('should escape application name', () => {
			const result = buildOauthPasswordEmailTemplate('user', 'pass', 'discord');

			expect(result).toContain('Discord');
		});

		it('should handle safe input without modification', () => {
			const result = buildOauthPasswordEmailTemplate('alice', 'Secret123!', 'github');

			expect(result).toContain('alice');
			expect(result).toContain('Secret123!');
		});
	});
});
