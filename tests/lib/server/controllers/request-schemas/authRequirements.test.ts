import { beforeEach, describe, expect, it } from 'vitest';
import { setApplicationConfigurationInMemory } from '$lib/server/applicationConfiguration/cache';
import { UserCreateSchema } from '$lib/server/controllers/request-schemas/users';
import { buildDefaultApplicationConfiguration } from '$lib/shared/applicationConfiguration';

const validPassword = 'ValidPass1!';
const validEmail = 'alice@example.com';
const emptyProfilePicture = new File([], '');

const createRegistrationForm = (overrides: Record<string, unknown> = {}) => ({
	username: 'alice',
	email: validEmail,
	password: validPassword,
	confirmedPassword: validPassword,
	profilePicture: emptyProfilePicture,
	...overrides,
});

describe('auth requirement schemas', () => {
	beforeEach(() => {
		setApplicationConfigurationInMemory(buildDefaultApplicationConfiguration());
	});

	it('accepts registration data that satisfies default auth limits', () => {
		const result = UserCreateSchema.form.safeParse(createRegistrationForm());

		expect(result.success).toBe(true);
	});

	it('rejects passwords longer than the current maximumPasswordLength', () => {
		setApplicationConfigurationInMemory({
			maximumPasswordLength: 10,
		});

		const result = UserCreateSchema.form.safeParse(
			createRegistrationForm({ password: validPassword, confirmedPassword: validPassword }),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.path.includes('password'))).toBe(true);
		}
	});

	it('rejects usernames longer than the current maximumUsernameLength', () => {
		setApplicationConfigurationInMemory({
			maximumUsernameLength: 5,
		});

		const result = UserCreateSchema.form.safeParse(
			createRegistrationForm({ username: 'alice123' }),
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.path.includes('username'))).toBe(true);
		}
	});
});
