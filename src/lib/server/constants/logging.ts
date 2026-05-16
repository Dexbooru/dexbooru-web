export const LOG_REDACT_SENSITIVE_KEYS = [
	'password',
	'confirmedPassword',
	'oldPassword',
	'newPassword',
	'confirmedNewPassword',
	'otpCode',
	'email',
	'token',
	'tokenId',
	'refreshToken',
	'accessToken',
	'authorization',
	'secret',
	'clientSecret',
	'recoveryId',
	'passwordRecoveryAttemptId',
	'apiKey',
] as const;

export const LOG_REDACT_SENSITIVE_KEY_SET = new Set(
	LOG_REDACT_SENSITIVE_KEYS.map((key) => key.toLowerCase()),
);
