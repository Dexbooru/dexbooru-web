/** Keys matched case-insensitively for request validation / debug logs. */
const SENSITIVE_KEY_NORMALIZED = new Set([
	'password',
	'confirmedpassword',
	'oldpassword',
	'newpassword',
	'confirmednewpassword',
	'otpcode',
	'email',
	'token',
	'tokenid',
	'refreshtoken',
	'accesstoken',
	'authorization',
	'secret',
	'clientsecret',
	'recoveryid',
	'passwordrecoveryattemptid',
	'apikey',
]);

const isSensitiveKey = (key: string) => SENSITIVE_KEY_NORMALIZED.has(key.toLowerCase());

/**
 * Returns a log-safe copy of parsed request parts (form, query, JSON body).
 * Redacts passwords, OTPs, emails, tokens, and similar fields (case-insensitive keys).
 */
export const redactForLog = (data: unknown): unknown => {
	if (data === null || typeof data !== 'object') {
		return data;
	}

	if (Array.isArray(data)) {
		return data.map((item) => redactForLog(item));
	}

	if (data instanceof File) {
		return `[File:${data.name || 'unnamed'}]`;
	}

	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
		if (isSensitiveKey(key)) {
			result[key] = '[REDACTED]';
			continue;
		}
		if (value !== null && typeof value === 'object') {
			result[key] = redactForLog(value);
		} else {
			result[key] = value;
		}
	}
	return result;
};
