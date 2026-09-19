/** Password for seeded role accounts (hashed on insert). Faker mock users do not use this. */
export const MOCK_USER_PASSWORD = 'password';

export const SEEDED_LOGIN_ACCOUNTS = [
	{ username: 'owner', role: 'OWNER' },
	{ username: 'moderator', role: 'MODERATOR' },
	{ username: 'user', role: 'USER' },
] as const;
