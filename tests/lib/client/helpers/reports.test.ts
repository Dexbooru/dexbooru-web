import { describe, expect, it } from 'vitest';
import { normalizeReportReasonName } from '$lib/client/helpers/reports';

describe('normalizeReportReasonName', () => {
	it('replaces underscores with spaces and capitalizes', () => {
		expect(normalizeReportReasonName('IMPROPER_TAGGING')).toBe('Improper tagging');
	});

	it('capitalizes single-word categories', () => {
		expect(normalizeReportReasonName('SPAM')).toBe('Spam');
	});

	it('handles multiple underscores', () => {
		expect(normalizeReportReasonName('INAPPROPRIATE_USERNAME')).toBe('Inappropriate username');
	});
});
