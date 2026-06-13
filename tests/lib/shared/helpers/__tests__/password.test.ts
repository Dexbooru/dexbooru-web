import { describe, expect, it } from 'vitest';
import { APPLICATION_CONFIGURATION_DEFAULTS } from '$lib/shared/applicationConfiguration/defaults';
import { getPasswordRequirements } from '$lib/shared/helpers/auth/password';

const defaultPasswordLimits = {
	minimumPasswordLength: APPLICATION_CONFIGURATION_DEFAULTS.minimumPasswordLength,
	maximumPasswordLength: APPLICATION_CONFIGURATION_DEFAULTS.maximumPasswordLength,
};

const validPassword = 'ValidPass1!';

describe('getPasswordRequirements', () => {
	it('accepts passwords within default length bounds', () => {
		const result = getPasswordRequirements(validPassword, defaultPasswordLimits);

		expect(result.unsatisfied).toHaveLength(0);
		expect(result.satisfied).toContain(
			`The password must be between ${defaultPasswordLimits.minimumPasswordLength} and ${defaultPasswordLimits.maximumPasswordLength} characters long`,
		);
	});

	it('rejects passwords longer than a custom maximum', () => {
		const result = getPasswordRequirements('ValidPass1!extra', {
			minimumPasswordLength: 8,
			maximumPasswordLength: 10,
		});

		expect(result.unsatisfied).toContain(
			'The password must be between 8 and 10 characters long',
		);
	});

	it('rejects passwords shorter than a custom minimum', () => {
		const result = getPasswordRequirements('Ab1!', {
			minimumPasswordLength: 8,
			maximumPasswordLength: 50,
		});

		expect(result.unsatisfied).toContain(
			'The password must be between 8 and 50 characters long',
		);
	});
});
