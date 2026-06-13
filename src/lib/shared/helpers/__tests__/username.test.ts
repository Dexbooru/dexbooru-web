import { describe, expect, it } from 'vitest';
import { APPLICATION_CONFIGURATION_DEFAULTS } from '$lib/shared/applicationConfiguration/defaults';
import { getUsernameRequirements } from '../auth/username';

const defaultUsernameLimits = {
	minimumUsernameLength: APPLICATION_CONFIGURATION_DEFAULTS.minimumUsernameLength,
	maximumUsernameLength: APPLICATION_CONFIGURATION_DEFAULTS.maximumUsernameLength,
};

describe('getUsernameRequirements', () => {
	describe('html-chars requirement', () => {
		it('should reject username with ampersand', () => {
			const result = getUsernameRequirements('user&name', defaultUsernameLimits);

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should reject username with less-than', () => {
			const result = getUsernameRequirements('user<script>', defaultUsernameLimits);

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should reject username with greater-than', () => {
			const result = getUsernameRequirements('user>name', defaultUsernameLimits);

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should reject username with double quote', () => {
			const result = getUsernameRequirements('user"name', defaultUsernameLimits);

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should reject username with single quote', () => {
			const result = getUsernameRequirements("user'name", defaultUsernameLimits);

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should accept username without HTML special characters', () => {
			const result = getUsernameRequirements('alice123', defaultUsernameLimits);

			expect(result.satisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should accept username with alphanumeric and underscores', () => {
			const result = getUsernameRequirements('user_name', defaultUsernameLimits);

			expect(result.unsatisfied).not.toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});
	});

	describe('length requirement', () => {
		it('rejects usernames longer than a custom maximum', () => {
			const result = getUsernameRequirements('abcdefghij', {
				minimumUsernameLength: 4,
				maximumUsernameLength: 8,
			});

			expect(result.unsatisfied).toContain('The username must be between 4 and 8 characters long');
		});

		it('accepts usernames within custom length bounds', () => {
			const result = getUsernameRequirements('alice', {
				minimumUsernameLength: 4,
				maximumUsernameLength: 8,
			});

			expect(result.satisfied).toContain('The username must be between 4 and 8 characters long');
		});
	});
});
