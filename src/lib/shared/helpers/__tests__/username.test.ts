import { describe, expect, it } from 'vitest';
import { getUsernameRequirements } from '../auth/username';

describe('getUsernameRequirements', () => {
	describe('html-chars requirement', () => {
		it('should reject username with ampersand', () => {
			const result = getUsernameRequirements('user&name');

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should reject username with less-than', () => {
			const result = getUsernameRequirements('user<script>');

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should reject username with greater-than', () => {
			const result = getUsernameRequirements('user>name');

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should reject username with double quote', () => {
			const result = getUsernameRequirements('user"name');

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should reject username with single quote', () => {
			const result = getUsernameRequirements("user'name");

			expect(result.unsatisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should accept username without HTML special characters', () => {
			const result = getUsernameRequirements('alice123');

			expect(result.satisfied).toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});

		it('should accept username with alphanumeric and underscores', () => {
			const result = getUsernameRequirements('user_name');

			expect(result.unsatisfied).not.toContain(
				'The username must not contain HTML special characters (e.g. &, <, >, ", \')',
			);
		});
	});
});
