import { describe, expect, it } from 'vitest';
import {
	buildPasswordRequirementMessages,
	buildUsernameRequirementMessages,
} from '$lib/shared/helpers/auth/requirementMessages';

describe('buildUsernameRequirementMessages', () => {
	it('builds a length message from the provided limits', () => {
		const messages = buildUsernameRequirementMessages({
			minimumUsernameLength: 5,
			maximumUsernameLength: 15,
		});

		expect(messages.length).toBe('The username must be between 5 and 15 characters long');
		expect(messages.spaces).toBeTruthy();
		expect(messages['html-chars']).toBeTruthy();
	});
});

describe('buildPasswordRequirementMessages', () => {
	it('builds a length message from the provided limits', () => {
		const messages = buildPasswordRequirementMessages({
			minimumPasswordLength: 10,
			maximumPasswordLength: 40,
		});

		expect(messages.length).toBe('The password must be between 10 and 40 characters long');
		expect(messages.lowercase).toBeTruthy();
		expect(messages.uppercase).toBeTruthy();
		expect(messages.number).toBeTruthy();
		expect(messages['special-character']).toBeTruthy();
	});
});
