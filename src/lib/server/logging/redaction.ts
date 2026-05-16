import { LOG_REDACT_SENSITIVE_KEY_SET } from '../constants/logging';

const isSensitiveKey = (key: string) => LOG_REDACT_SENSITIVE_KEY_SET.has(key.toLowerCase());

export const redaction = (data: unknown): unknown => {
	if (data === null || typeof data !== 'object') {
		return data;
	}

	if (Array.isArray(data)) {
		return data.map((item) => redaction(item));
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
			result[key] = redaction(value);
		} else {
			result[key] = value;
		}
	}
	return result;
};
